/// <reference path="../node_modules/pxt-core/localtypings/pxteditor.d.ts"/>
/// <reference path="../node_modules/pxt-core/built/pxtsim.d.ts"/>

import HF2 = pxt.HF2;
import UF2 = pxtc.UF2;

import { Ev3Wrapper } from "./wrap";
import { bluetoothTryAgainAsync, showEv3BusyDialogAsync } from "./dialogs";


enum IOState {
    Disconnected,
    Connecting,
    Connected
}

class WebSerialIO implements pxt.packetio.PacketIO {
    // Web Serial API https://wicg.github.io/serial/

    onData = (v: Uint8Array) => {};
    onEvent = (v: Uint8Array) => {};
    onError = (e: Error) => {};
    error: (msg: string) => void;
    onConnectionChanged = () => {};
    onDeviceConnectionChanged = () => {};

    private reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
    private writer: WritableStreamDefaultWriter<Uint8Array> | undefined;
    
    private state: IOState = IOState.Disconnected;

    constructor(private port: any) {
        console.log("serial: New WebSerialIO");
    }

    static supported(): boolean {
        return !!(navigator as any).serial;
    }

    static async createAsync(forceRequest: boolean): Promise<WebSerialIO> {
        const serial = (navigator as any).serial;
        if (!serial) throw new Error("WebSerial not supported");

        let port: any;

        if (!forceRequest) {
            const ports = await serial.getPorts();
            // Используем ранее разрешённый порт
            if (ports && ports.length > 0) {
                port = ports[0];
            }
        }

        // Если порт не найден ИЛИ forceRequest = true
        if (!port) {
            try {
                port = await serial.requestPort({
                    filters: [{
                        bluetoothServiceClassId: "00001101-0000-1000-8000-00805f9b34fb"
                    }]
                }); // Bluetooth Classic Serial Port Profile (SPP)
            } catch (e: any) {
                // Пользователь закрыл окно выбора порта
                if (e?.name === "NotFoundError") {
                    throw new Error("NO_PORT_SELECTED");
                }
                // Пользователь запретил доступ
                if (e?.name === "SecurityError") {
                    throw new Error("PORT_PERMISSION_DENIED");
                }
                throw e; // Всё остальное — пробрасываем дальше
            }
        }

        return new WebSerialIO(port);
    }

    isConnected() {
        return this.state === IOState.Connected;
    }

    isConnecting() {
        return this.state === IOState.Connecting;
    }

    async reconnectAsync(): Promise<void> {
        // if (this.isOpen) return;
        // if (this.isOpen) {
        //     try { await this.disconnectAsync(); } catch {}
        // }

        if (this.state === IOState.Connected) {
            // Порт уже открыт — не трогаем, т.к. Timeout не означает разрыв
            return;
        }

        if (this.state === IOState.Connecting) {
            throw new Error("CONNECT_IN_PROGRESS");
        }

        this.state = IOState.Connecting;

        try {
            await this.port.open({ baudRate: 460800, bufferSize: 4096 });
            this.state = IOState.Connected;
            this.onConnectionChanged();
            this.startReader();
        } catch (e: any) {
            this.state = IOState.Disconnected;
            const name = e?.name || "";
            if (name === "NetworkError") {
                throw new Error("PORT_OPEN_FAILED");
            }
            if (name === "SecurityError") {
                throw new Error("PORT_PERMISSION_DENIED");
            }
            throw e;
        }
    }

    async disconnectAsync(): Promise<void> {
        if (this.state === IOState.Disconnected) {
            return;
        }

        this.state = IOState.Disconnected;

        try {
            if (this.reader) {
                try { await this.reader.cancel(); } catch {}
                try { this.reader.releaseLock(); } catch {}
                this.reader = undefined;
            }
            if (this.writer) {
                try { this.writer.releaseLock(); } catch {}
                this.writer = undefined;
            }
            await this.port.close();
        } catch (e) {
            console.warn("serial close error", e);
        }
        this.onConnectionChanged();
    }

    async sendPacketAsync(pkt: Uint8Array): Promise<void> {
        if (!this.writer) {
            this.writer = this.port.writable.getWriter();
        }
        await this.writer.write(pkt);
    }

    disposeAsync(): Promise<void> {
        return this.disconnectAsync();
    }

    bufferSize(buf: Uint8Array) {
        return pxt.HF2.read16(buf, 0) + 2;
    }

    private async startReader() {
        this.reader = this.port.readable.getReader();
        let buffer: Uint8Array | undefined;

        try {
            while (this.state === IOState.Connected) {
                const { done, value } = await this.reader.read();
                if (done || !value) break;

                buffer = buffer ? pxt.U.uint8ArrayConcat([buffer, value]) : value;

                while (buffer && buffer.length >= 2) {
                    const size = pxt.HF2.read16(buffer, 0) + 2;
                    if (buffer.length < size) break;

                    const pkt = buffer.slice(0, size);
                    this.onData(pkt);

                    buffer = buffer.length > size ? buffer.slice(size) : undefined;
                }
            }
        } catch (e) {
            console.warn("Reader crashed", e);
        } finally {
            this.state = IOState.Disconnected;
            try { this.reader?.releaseLock(); } catch {}
            this.reader = undefined;
            this.onConnectionChanged();
        }
    }
    
}


enum TransportState {
    Unpaired,
    Idle,
    Connecting,
    Connected,
    Disconnecting,
    FatalError
}

class TransportManager {

    private state = TransportState.Unpaired;
    private wrapper?: Ev3Wrapper;
    private io?: WebSerialIO;

    private connectPromise?: Promise<Ev3Wrapper>; // Защита от параллельных connectAsync()

    async connectAsync(): Promise<Ev3Wrapper> {
        // Уже подключены
        if (this.state === TransportState.Connected && this.wrapper) {
            return this.wrapper;
        }
        // Если уже идёт подключение — возвращаем тот же Promise
        if (this.connectPromise) {
            return this.connectPromise;
        }

        this.connectPromise = this.doConnectAsync();
        try {
            return await this.connectPromise;
        } finally {
            this.connectPromise = undefined;
        }
    }

    private async doConnectAsync(): Promise<Ev3Wrapper> {
        if (!WebSerialIO.supported()) {
            this.state = TransportState.FatalError;
            throw new Error("WebSerial not supported");
        }

        try {
            // Если IO уже существует — сначала закрываем его
            // if (this.io) {
            //     try { await this.io.disconnectAsync(); } catch {}
            //     this.io = undefined;
            //     this.wrapper = undefined;
            // }
            // Не создаём новый IO если он уже существует
            if (!this.io) {
                const force = this.state === TransportState.Unpaired;
                this.io = await WebSerialIO.createAsync(force);
            }
            // this.io = await WebSerialIO.createAsync(false);
            this.state = TransportState.Connecting;
            await this.io.reconnectAsync();
            if (!this.wrapper) {
                this.wrapper = new Ev3Wrapper(this.io);
            }
            // this.wrapper = new Ev3Wrapper(this.io);
            this.state = TransportState.Connected;
            return this.wrapper;
        } catch (e: any) {
            // Пользователь просто закрыл окно выбора порта
            if (e?.message === "NO_PORT_SELECTED") {
                this.state = TransportState.Idle;
                throw e;
            }
            if (e?.message === "PORT_PERMISSION_DENIED") {
                this.state = TransportState.Idle;
                throw e;
            }
            if (e?.message === "PORT_OPEN_FAILED") {
                console.warn("Bluetooth connection is stuck. Windows did not release the RFCOMM channel. Please reset Bluetooth or re-enable the COM port.");
                await bluetoothTryAgainAsync();
                // Уничтожаем старый IO если он есть
                if (this.io) {
                    try { await this.io.disconnectAsync(); } catch {}
                    this.io = undefined;
                    this.wrapper = undefined;
                }
                this.state = TransportState.Connecting;
                try {
                    // Retry — принудительный выбор порта
                    await this.openAsync(true);
                    this.state = TransportState.Connected;
                    return this.wrapper!;
                } catch (retryError) {
                    this.state = TransportState.FatalError;
                    throw retryError;
                }
            }
            this.state = TransportState.FatalError;
            throw e;
        }
    }

    private async openAsync(forceRequest: boolean): Promise<void> {
        this.io = await WebSerialIO.createAsync(forceRequest);
        try {
            await this.io.reconnectAsync();
        } catch (e) {
            // Если reconnect не удался — чистим io
            this.io = undefined;
            throw e;
        }
        this.wrapper = new Ev3Wrapper(this.io);
    }

    async disconnectAsync() {
        if (!this.io) {
            this.state = TransportState.Idle;
            return;
        }
        this.state = TransportState.Disconnecting;
        try {
            await this.io.disconnectAsync();
        } finally {
            this.io = undefined;
            this.wrapper = undefined;
            this.state = TransportState.Idle;
        }
    }

    async hardResetAsync() {
        console.log("serial: HARD RESET");
        try { await this.disconnectAsync(); } catch {}
        this.state = TransportState.Idle;
    }

}


enum DeployTransport {
    FileTransfer,
    BluetoothWebSerial,
    UsbHid
}

let preferredTransport = DeployTransport.FileTransfer;

export function canUseWebSerial(): boolean {
    return !!(navigator as any).serial;
}

export function setUseUsbHID() {
    preferredTransport = DeployTransport.UsbHid;
}

export function setUseBluetoothWebSerial() {
    preferredTransport = DeployTransport.BluetoothWebSerial;
}

export async function enableBluetoothWebSerialAsync(): Promise<void> {
    preferredTransport = DeployTransport.BluetoothWebSerial;
}


const transport = new TransportManager();

// This comes from aux/pxt.lms
const defaultDeployFolder = "BrkProg_SAVE";
const rbfTemplate = `
4c45474f580000006d000100000000001c000000000000000e000000821b038405018130813e8053
74617274696e672e2e2e0084006080XX00448581644886488405018130813e80427965210084000a
`;

export async function deployCoreAsync(resp: pxtc.CompileResult) {
    const filename = (resp.downloadFileBaseName || "pxt").replace(/^lego-/, "");

    const projectPxtJson = await (window as any).getPxtJson();

    const isWebSerial = preferredTransport === DeployTransport.BluetoothWebSerial;

    const deployFolder =
        isWebSerial && projectPxtJson?.deployFolder ? projectPxtJson.deployFolder : defaultDeployFolder;

    const fspath = `../prjs/${deployFolder}/`;
    console.log(`fspath: ${fspath}`);
    const elfPath = fspath + filename + ".elf";
    const rbfPath = fspath + filename + ".rbf";

    // Build rbf
    const rbfHex = rbfTemplate
        .replace(/\s+/g, "")
        .replace("XX", pxt.U.toHex(pxt.U.stringToUint8Array(elfPath)));

    const rbfBIN = pxt.U.fromHex(rbfHex);
    HF2.write16(rbfBIN, 4, rbfBIN.length);

    // Parse elf
    const origElfUF2 = UF2.parseFile(
        pxt.U.stringToUint8Array(
            ts.pxtc.decodeBase64(resp.outfiles[pxt.outputName()])
        )
    );
    
    // USB MODE (UF2 packaging like original pxt-ev3)
    if (!isWebSerial) {
        const mkFile = (ext: string, data?: Uint8Array) => {
            const f = UF2.newBlockFile();
            f.filename = "Projects/" + filename + ext;
            if (data) UF2.writeBytes(f, 0, data);
            return f;
        };

        const elfUF2 = mkFile(".elf");

        for (const b of origElfUF2) {
            UF2.writeBytes(elfUF2, b.targetAddr, b.data);
        }

        const combined = UF2.concatFiles([
            elfUF2,
            mkFile(".rbf", rbfBIN)
        ]);

        const data = UF2.serializeFile(combined);

        resp.outfiles[pxtc.BINARY_UF2] = btoa(data);

        if (pxt.commands?.electronDeployAsync) {
            return pxt.commands.electronDeployAsync(resp);
        }
        if (pxt.commands?.saveOnlyAsync) {
            return pxt.commands.saveOnlyAsync(resp);
        }

        return Promise.resolve();
    }

    // WEBSERIAL MODE
    pxt.tickEvent("webserial.flash");
    try {
        const wrapper = await transport.connectAsync();
        // if (wrapper.isStreaming) pxt.U.userError("Stop program first"); // Data values streaming? Not use
        
        try {
            await wrapper.stopAsync();
        } catch (e: any) {
            if (/Timeout/i.test(e?.message || "")) {
                console.warn("Timeout. EV3 is busy. Stop the running program and try again.");
                await showEv3BusyDialogAsync();
                return;
            }
            throw e;
        }
        await wrapper.rmAsync(elfPath);
        await wrapper.flashAsync(
            elfPath,
            UF2.readBytes(origElfUF2, 0, origElfUF2.length * 256)
        );
        await wrapper.flashAsync(rbfPath, rbfBIN);
        await wrapper.runAsync(rbfPath);
        pxt.tickEvent("webserial.success");
    } catch (e: any) {
        pxt.tickEvent("webserial.fail");
        // await transport.hardResetAsync();
        throw e;
    }
}

// (pxt.commands as any).getDownloadMenuItems = () => {
//     return [
//         {
//             text: lf("Download as File"),
//             icon: "download",
//             value: "usb"
//         },
//         {
//             text: lf("Download via Bluetooth"),
//             icon: "bluetooth",
//             value: "webserial"
//         }
//     ];
// };

// (pxt.commands as any).onDownloadMenuItemClick = async (opts: any) => {
//     console.log("Download menu click:", opts);
//     const value = opts?.value;
//     if (value === "webserial") {
//         preferredTransport = "webserial";
//     } else {
//         preferredTransport = undefined;
//     }
//     await (window as any).projectView.compile();
// };