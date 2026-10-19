#include "pxt.h"
#include "ev3const.h"

#include <unistd.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <sys/select.h>
#include <fcntl.h>
#include <errno.h>
#include <string.h>
#include <stdlib.h>
#include <stdio.h>
#include <pthread.h>

// ──────────────────────────────────────────────────────────────────────────────
// EV3 Bluetooth brick-to-brick messaging
//
// Protocol reference: LEGO MINDSTORMS EV3 Communication Developer Kit, §3.3.9
//
// WRITEMAILBOX is a **System Command** (NOT a Direct Command):
//   byte[4] = 0x81 (SYSTEM_COMMAND_NO_REPLY)
//   byte[5] = 0x9E (WRITEMAILBOX)
//
// Packet format:
//   [0-1]  message length (LE uint16, excluding these 2 bytes)
//   [2-3]  message counter (LE uint16)
//   [4]    0x81   SYSTEM_COMMAND_NO_REPLY
//   [5]    0x9E   WRITEMAILBOX
//   [6]    mailbox name length (number of chars, EXCLUDING null terminator)
//   [7..]  mailbox name (null-terminated)
//   [N..N+3] payload size (LE uint32)
//   [N+4..]  payload bytes
//
// EV3_AF_BLUETOOTH, EV3_BTPROTO_RFCOMM, VM_BRICK_NAME_SIZE from ev3const.h
// ──────────────────────────────────────────────────────────────────────────────
#define BT_RFCOMM_CHANNEL       1
#define BT_MAX_CONNECTIONS      7       // BT piconet limit (matches EV3-G)
#define BT_MAX_MAILBOX_NAME     248
#define BT_MAX_MAILBOX_DATA     1024

// EV3 System Command type bytes (Communication Developer Kit §3)
#define SYSTEM_COMMAND_REPLY        0x01
#define SYSTEM_COMMAND_NO_REPLY     0x81
#define SYSTEM_REPLY                0x03
#define SYSTEM_REPLY_ERROR          0x05
#define WRITEMAILBOX                0x9E

// MailboxDataType values — must match enums.d.ts
#define MBOX_TYPE_TEXT      0
#define MBOX_TYPE_NUMERIC   1
#define MBOX_TYPE_LOGIC     2

// ──────────────────────────────────────────────────────────────────────────────
// sockaddr_rc — mirrors BlueZ struct sockaddr_rc
// ──────────────────────────────────────────────────────────────────────────────
struct BtBdAddr { uint8_t b[6]; };

struct SockAddrRc {
    sa_family_t rc_family;
    BtBdAddr    rc_bdaddr;
    uint8_t     rc_channel;
};

// ──────────────────────────────────────────────────────────────────────────────
// Connection slot
// ──────────────────────────────────────────────────────────────────────────────
struct BtConnection {
    int     fd;
    char    brickName[VM_BRICK_NAME_SIZE];
    bool    active;
};

// ──────────────────────────────────────────────────────────────────────────────
// Mailbox receive slot
// ──────────────────────────────────────────────────────────────────────────────
#define MAX_MAILBOX_SLOTS 16

struct MailboxSlot {
    char    name[BT_MAX_MAILBOX_NAME];
    uint8_t dataType;                   // MBOX_TYPE_*
    uint8_t data[BT_MAX_MAILBOX_DATA];  // last received raw value
    int     dataLen;
    int     eventSrc;                   // pxt event source id
    int     eventVal;                   // pxt event value
};

namespace pxt {

static BtConnection    btConns[BT_MAX_CONNECTIONS];
static int             btConnCount  = 0;
static pthread_mutex_t btMutex      = PTHREAD_MUTEX_INITIALIZER;
static bool            btRxRunning  = false;

static MailboxSlot     mailboxSlots[MAX_MAILBOX_SLOTS];
static int             mailboxSlotCount = 0;

// ── Helpers ───────────────────────────────────────────────────────────────────

static void packU16LE(uint8_t *dst, uint16_t v) {
    dst[0] = v & 0xFF;
    dst[1] = (v >> 8) & 0xFF;
}

static void packU32LE(uint8_t *dst, uint32_t v) {
    dst[0] = v & 0xFF;
    dst[1] = (v >> 8) & 0xFF;
    dst[2] = (v >> 16) & 0xFF;
    dst[3] = (v >> 24) & 0xFF;
}

static uint16_t unpackU16LE(const uint8_t *src) {
    return (uint16_t)(src[0] | (src[1] << 8));
}

static uint32_t unpackU32LE(const uint8_t *src) {
    return (uint32_t)(src[0] | (src[1] << 8) | (src[2] << 16) | (src[3] << 24));
}

// ── Send a WRITEMAILBOX System Command packet ────────────────────────────────
//
// Per EV3 Communication Developer Kit §3.3.9:
//   bbbbmmmmttssllaaaaa...LLLLppp...
//
//   bbbb = message length (LE, excluding these 2 bytes)
//   mmmm = message counter (LE)
//   tt   = 0x81 (SYSTEM_COMMAND_NO_REPLY)
//   ss   = 0x9E (WRITEMAILBOX)
//   ll   = mailbox name length (chars, EXCLUDING null terminator)
//   aaa  = mailbox name (null-terminated string)
//   LLLL = payload size (LE uint32)
//   ppp  = payload bytes
// ──────────────────────────────────────────────────────────────────────────────
static bool sendMailboxPacket(int fd, const char *mailbox,
                              const uint8_t *payload, int payloadLen,
                              uint16_t msgcount) {
    uint8_t buf[BT_MAX_MAILBOX_DATA + 64];
    int pos = 0;

    int nameChars = (int)strlen(mailbox); // length EXCLUDING null terminator

    // [0-1] placeholder for message length
    buf[pos++] = 0; buf[pos++] = 0;
    // [2-3] message counter
    packU16LE(buf + pos, msgcount); pos += 2;
    // [4] SYSTEM_COMMAND_NO_REPLY
    buf[pos++] = SYSTEM_COMMAND_NO_REPLY;
    // [5] WRITEMAILBOX
    buf[pos++] = WRITEMAILBOX;
    // [6] mailbox name length (EXCLUDING null terminator, per spec)
    buf[pos++] = (uint8_t)nameChars;
    // [7..] mailbox name (null-terminated)
    memcpy(buf + pos, mailbox, nameChars + 1); // copy including null
    pos += nameChars + 1;
    // payload size (LE uint32)
    packU32LE(buf + pos, (uint32_t)payloadLen);
    pos += 4;
    // payload bytes
    if (payloadLen > 0) {
        memcpy(buf + pos, payload, payloadLen);
        pos += payloadLen;
    }

    // fill in message length = pos - 2
    packU16LE(buf, (uint16_t)(pos - 2));

    return write(fd, buf, pos) == pos;
}

// ── Parse an incoming packet and raise pxt events for matching mailboxes ──────
static void handleIncomingPacket(const uint8_t *pkt, int totalLen) {
    if (totalLen < 8) return;

    uint8_t cmdType = pkt[4];
    uint8_t sysCmd  = pkt[5];

    // Accept both SYSTEM_COMMAND_NO_REPLY and SYSTEM_COMMAND_REPLY
    if (cmdType != SYSTEM_COMMAND_NO_REPLY && cmdType != SYSTEM_COMMAND_REPLY) return;
    if (sysCmd != WRITEMAILBOX) return;

    // [6] = name length (excluding null)
    int nameLen = pkt[6];
    if (nameLen <= 0) return;

    int nameStart = 7;
    int nameEnd = nameStart + nameLen + 1; // +1 for null terminator
    if (nameEnd >= totalLen) return;

    char mailboxName[BT_MAX_MAILBOX_NAME];
    int cn = nameLen < (int)sizeof(mailboxName) - 1 ? nameLen : (int)sizeof(mailboxName) - 1;
    memcpy(mailboxName, pkt + nameStart, cn);
    mailboxName[cn] = 0;

    // payload size (LE uint32)
    int payloadSizeOff = nameEnd;
    if (payloadSizeOff + 4 > totalLen) return;
    uint32_t payloadSize = unpackU32LE(pkt + payloadSizeOff);

    int payloadOff = payloadSizeOff + 4;
    if (payloadOff + (int)payloadSize > totalLen) return;

    const uint8_t *payloadData = pkt + payloadOff;

    pthread_mutex_lock(&btMutex);
    for (int i = 0; i < mailboxSlotCount; i++) {
        MailboxSlot &s = mailboxSlots[i];
        if (strcmp(s.name, mailboxName) != 0) continue;

        int safeLen = (int)payloadSize;
        if (safeLen > (int)sizeof(s.data) - 1) safeLen = (int)sizeof(s.data) - 1;
        memcpy(s.data, payloadData, safeLen);
        s.data[safeLen] = 0;
        s.dataLen = safeLen;

        pxt::raiseEvent(s.eventSrc, s.eventVal);
        break;
    }
    pthread_mutex_unlock(&btMutex);
}

// ── Receive thread: watches all active connections with select() ──────────────
static void *btReceiveThread(void *) {
    uint8_t pktBuf[4096];
    uint8_t rxBufs[BT_MAX_CONNECTIONS][4096];
    int     rxLens[BT_MAX_CONNECTIONS] = {};

    while (btRxRunning) {
        fd_set fds;
        FD_ZERO(&fds);
        int maxFd = -1;

        pthread_mutex_lock(&btMutex);
        for (int i = 0; i < btConnCount; i++) {
            if (!btConns[i].active || btConns[i].fd < 0) continue;
            FD_SET(btConns[i].fd, &fds);
            if (btConns[i].fd > maxFd) maxFd = btConns[i].fd;
        }
        pthread_mutex_unlock(&btMutex);

        if (maxFd < 0) { usleep(50000); continue; }

        struct timeval tv = {0, 100000};
        if (select(maxFd + 1, &fds, NULL, NULL, &tv) <= 0) continue;

        pthread_mutex_lock(&btMutex);
        for (int i = 0; i < btConnCount; i++) {
            if (!btConns[i].active || btConns[i].fd < 0) continue;
            int fd = btConns[i].fd;
            if (!FD_ISSET(fd, &fds)) continue;

            int len = read(fd, rxBufs[i] + rxLens[i], sizeof(rxBufs[i]) - rxLens[i]);
            if (len <= 0) {
                DMESG("BT: conn %d closed errno=%d", i, errno);
                close(fd);
                btConns[i].fd = -1;
                btConns[i].active = false;
                rxLens[i] = 0;
                continue;
            }
            rxLens[i] += len;

            while (rxLens[i] >= 2) {
                int msgLen   = unpackU16LE(rxBufs[i]);
                int totalLen = msgLen + 2;
                if (msgLen < 2 || totalLen > (int)sizeof(rxBufs[i])) {
                    DMESG("BT: bad pkt len=%d, reset", msgLen);
                    rxLens[i] = 0; break;
                }
                if (rxLens[i] < totalLen) break;

                memcpy(pktBuf, rxBufs[i], totalLen);
                int rem = rxLens[i] - totalLen;
                if (rem > 0) memmove(rxBufs[i], rxBufs[i] + totalLen, rem);
                rxLens[i] = rem;

                pthread_mutex_unlock(&btMutex);
                handleIncomingPacket(pktBuf, totalLen);
                pthread_mutex_lock(&btMutex);
            }
        }
        pthread_mutex_unlock(&btMutex);
    }
    return NULL;
}

static void ensureRxThread() {
    if (btRxRunning) return;
    btRxRunning = true;
    pthread_t tid;
    pthread_create(&tid, NULL, btReceiveThread, NULL);
    pthread_detach(tid);
}

// ── Parse "XX:XX:XX:XX:XX:XX" → 6-byte BtBdAddr (little-endian) ──────────────
static bool parseBtAddr(const char *str, BtBdAddr &out) {
    unsigned int b[6];
    if (sscanf(str, "%x:%x:%x:%x:%x:%x",
               &b[5],&b[4],&b[3],&b[2],&b[1],&b[0]) != 6) return false;
    for (int i = 0; i < 6; i++) out.b[i] = (uint8_t)b[i];
    return true;
}

// ── Find BT address for a brick name using hcitool ────────────────────────────
static bool findAddrByName(const char *brickName, char addrOut[18]) {
    FILE *f = popen("/usr/bin/hcitool con", "r");
    if (!f) { DMESG("BT: hcitool con failed errno=%d", errno); return false; }

    char line[256], addr[18];
    bool found = false;

    while (fgets(line, sizeof(line), f) && !found) {
        char *p = strstr(line, "ACL ");
        if (!p) continue;
        p += 4;
        if (sscanf(p, "%17s", addr) != 1 || strlen(addr) != 17) continue;

        char cmd[64];
        snprintf(cmd, sizeof(cmd), "/usr/bin/hcitool name %s", addr);
        FILE *nc = popen(cmd, "r");
        if (!nc) continue;

        char nameBuf[VM_BRICK_NAME_SIZE];
        if (fgets(nameBuf, sizeof(nameBuf), nc)) {
            nameBuf[strcspn(nameBuf, "\r\n")] = 0;
            if (strcasecmp(nameBuf, brickName) == 0) {
                strncpy(addrOut, addr, 17); addrOut[17] = 0;
                found = true;
            }
        }
        pclose(nc);
    }
    pclose(f);
    if (!found) DMESG("BT: brick '%s' not found", brickName);
    return found;
}

// ── Internal: find or create a mailbox slot ───────────────────────────────────
static int getOrCreateSlot(const char *mailbox, uint8_t dataType) {
    pthread_mutex_lock(&btMutex);
    for (int i = 0; i < mailboxSlotCount; i++) {
        if (strcmp(mailboxSlots[i].name, mailbox) == 0 &&
            mailboxSlots[i].dataType == dataType) {
            int idx = i;
            pthread_mutex_unlock(&btMutex);
            return idx;
        }
    }
    if (mailboxSlotCount >= MAX_MAILBOX_SLOTS) {
        pthread_mutex_unlock(&btMutex);
        return -1;
    }
    int idx = mailboxSlotCount++;
    MailboxSlot &s = mailboxSlots[idx];
    strncpy(s.name, mailbox, BT_MAX_MAILBOX_NAME - 1);
    s.name[BT_MAX_MAILBOX_NAME - 1] = 0;
    s.dataType  = dataType;
    s.dataLen   = 0;
    memset(s.data, 0, sizeof(s.data));
    s.eventSrc  = pxt::allocateNotifyEvent();
    s.eventVal  = idx + 1;
    pthread_mutex_unlock(&btMutex);
    return idx;
}

// ── Broadcast to all active connections ───────────────────────────────────────
static uint16_t msgCounter = 0;

static void broadcastMailbox(const char *mailbox,
                             const uint8_t *payload, int payloadLen) {
    uint16_t mc = ++msgCounter;
    pthread_mutex_lock(&btMutex);
    for (int i = 0; i < btConnCount; i++) {
        if (!btConns[i].active || btConns[i].fd < 0) continue;
        if (!sendMailboxPacket(btConns[i].fd, mailbox, payload, payloadLen, mc))
            DMESG("BT: send to '%s' failed errno=%d", btConns[i].brickName, errno);
    }
    pthread_mutex_unlock(&btMutex);
}

} // namespace pxt

// ──────────────────────────────────────────────────────────────────────────────
// Public namespace exposed to TypeScript via shims
// ──────────────────────────────────────────────────────────────────────────────
namespace bluetooth {

using namespace pxt;

//%
void connectToBrick(String brickName) {
    if (!brickName) return;
    const char *name = brickName->getUTF8Data();

    pthread_mutex_lock(&btMutex);
    for (int i = 0; i < btConnCount; i++) {
        if (btConns[i].active && strcasecmp(btConns[i].brickName, name) == 0) {
            pthread_mutex_unlock(&btMutex);
            DMESG("BT: already connected to '%s'", name);
            return;
        }
    }
    if (btConnCount >= BT_MAX_CONNECTIONS) {
        pthread_mutex_unlock(&btMutex);
        DMESG("BT: max connections reached");
        return;
    }
    pthread_mutex_unlock(&btMutex);

    char addr[18] = {};
    if (!findAddrByName(name, addr)) return;

    int fd = socket(EV3_AF_BLUETOOTH, SOCK_STREAM, EV3_BTPROTO_RFCOMM);
    if (fd < 0) { DMESG("BT: socket() errno=%d", errno); return; }

    SockAddrRc remote;
    memset(&remote, 0, sizeof(remote));
    remote.rc_family  = EV3_AF_BLUETOOTH;
    remote.rc_channel = BT_RFCOMM_CHANNEL;
    if (!parseBtAddr(addr, remote.rc_bdaddr)) {
        DMESG("BT: bad addr '%s'", addr);
        close(fd); return;
    }

    DMESG("BT: connecting to '%s' at %s", name, addr);
    if (connect(fd, (struct sockaddr *)&remote, sizeof(remote)) < 0) {
        DMESG("BT: connect() errno=%d", errno);
        close(fd); return;
    }
    DMESG("BT: connected to '%s'", name);

    pthread_mutex_lock(&btMutex);
    int slot = btConnCount++;
    btConns[slot].fd     = fd;
    btConns[slot].active = true;
    strncpy(btConns[slot].brickName, name, VM_BRICK_NAME_SIZE - 1);
    btConns[slot].brickName[VM_BRICK_NAME_SIZE - 1] = 0;
    pthread_mutex_unlock(&btMutex);

    ensureRxThread();
}

//%
bool isConnected(String brickName) {
    pthread_mutex_lock(&btMutex);
    bool found = false;
    if (!brickName || brickName->getUTF8Size() == 0) {
        for (int i = 0; i < btConnCount && !found; i++)
            found = btConns[i].active;
    } else {
        const char *name = brickName->getUTF8Data();
        for (int i = 0; i < btConnCount && !found; i++)
            found = btConns[i].active && strcasecmp(btConns[i].brickName, name) == 0;
    }
    pthread_mutex_unlock(&btMutex);
    return found;
}

//%
void disconnectBrick(String brickName) {
    if (!brickName) return;
    const char *name = brickName->getUTF8Data();
    pthread_mutex_lock(&btMutex);
    for (int i = 0; i < btConnCount; i++) {
        if (btConns[i].active && strcasecmp(btConns[i].brickName, name) == 0) {
            close(btConns[i].fd);
            btConns[i].fd = -1;
            btConns[i].active = false;
            break;
        }
    }
    pthread_mutex_unlock(&btMutex);
}

//%
void sendTextMessage(String mailbox, String value) {
    if (!mailbox || !value) return;
    const char *val = value->getUTF8Data();
    int len = (int)strlen(val) + 1; // include null terminator in payload
    broadcastMailbox(mailbox->getUTF8Data(), (const uint8_t *)val, len);
}

//%
void sendNumberMessage(String mailbox, TNumber value) {
    if (!mailbox) return;
    float fval = (float)toDouble(value);
    broadcastMailbox(mailbox->getUTF8Data(), (const uint8_t *)&fval, 4);
}

//%
void sendLogicMessage(String mailbox, bool value) {
    if (!mailbox) return;
    uint8_t v = value ? 1 : 0;
    broadcastMailbox(mailbox->getUTF8Data(), &v, 1);
}

//%
int _registerMailboxHandler(String mailbox, int dataType) {
    if (!mailbox) return -1;
    int idx = getOrCreateSlot(mailbox->getUTF8Data(), (uint8_t)dataType);
    return idx < 0 ? -1 : mailboxSlots[idx].eventSrc;
}

//%
String lastTextMessage(String mailbox) {
    if (!mailbox) return mkString("", 0);
    const char *mbox = mailbox->getUTF8Data();
    pthread_mutex_lock(&btMutex);
    for (int i = 0; i < mailboxSlotCount; i++) {
        MailboxSlot &s = mailboxSlots[i];
        if (s.dataType == MBOX_TYPE_TEXT && strcmp(s.name, mbox) == 0) {
            String r = mkString((const char *)s.data, s.dataLen);
            pthread_mutex_unlock(&btMutex);
            return r;
        }
    }
    pthread_mutex_unlock(&btMutex);
    return mkString("", 0);
}

//%
TNumber lastNumberMessage(String mailbox) {
    if (!mailbox) return fromDouble(0);
    const char *mbox = mailbox->getUTF8Data();
    pthread_mutex_lock(&btMutex);
    for (int i = 0; i < mailboxSlotCount; i++) {
        MailboxSlot &s = mailboxSlots[i];
        if (s.dataType == MBOX_TYPE_NUMERIC && s.dataLen >= 4 && strcmp(s.name, mbox) == 0) {
            float fval; memcpy(&fval, s.data, 4);
            pthread_mutex_unlock(&btMutex);
            return fromDouble((double)fval);
        }
    }
    pthread_mutex_unlock(&btMutex);
    return fromDouble(0);
}

//%
bool lastLogicMessage(String mailbox) {
    if (!mailbox) return false;
    const char *mbox = mailbox->getUTF8Data();
    pthread_mutex_lock(&btMutex);
    for (int i = 0; i < mailboxSlotCount; i++) {
        MailboxSlot &s = mailboxSlots[i];
        if (s.dataType == MBOX_TYPE_LOGIC && s.dataLen >= 1 && strcmp(s.name, mbox) == 0) {
            bool v = s.data[0] != 0;
            pthread_mutex_unlock(&btMutex);
            return v;
        }
    }
    pthread_mutex_unlock(&btMutex);
    return false;
}

} // namespace bluetooth
