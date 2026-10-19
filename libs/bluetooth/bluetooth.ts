/**
 * Bluetooth brick-to-brick messaging, compatible with EV3-G.
 */
//% color="#0082DB" weight=85 icon="\uf293"
//% groups='["Connection", "Send", "Receive", "Mailbox"]'
namespace bluetooth {

    // ─────────────────────────────────────────────────────────────────────────
    // Connection
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Connect to another EV3 brick by its name over Bluetooth.
     * @param brickName name of the brick to connect to, eg: "EV3"
     */
    //% blockId=bt_connect_to_brick
    //% block="connect to brick $brickName"
    //% brickName.defl="EV3"
    //% weight=100 group="Connection"
    //% shim=bluetooth::connectToBrick
    export function connectToBrick(brickName: string): void {
        return;
    }

    /**
     * Returns true if connected to the specified brick.
     * @param brickName name of the brick to check, eg: "EV3"
     */
    //% blockId=bt_is_connected
    //% block="bluetooth connected to $brickName"
    //% brickName.defl="EV3"
    //% weight=90 group="Connection"
    //% shim=bluetooth::isConnected
    export function isConnected(brickName: string): boolean {
        return false;
    }

    /**
     * Disconnect from a specific brick.
     * @param brickName name of the brick to disconnect, eg: "EV3"
     */
    //% blockId=bt_disconnect
    //% block="disconnect from brick $brickName"
    //% brickName.defl="EV3"
    //% weight=80 group="Connection"
    //% shim=bluetooth::disconnectBrick
    export function disconnectBrick(brickName: string): void {
        return;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Send
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Send a text message to a mailbox on all connected bricks.
     * @param mailbox the mailbox name, eg: "mailbox1"
     * @param value the text to send, eg: "hello"
     */
    //% blockId=bt_send_text
    //% block="send text $value to mailbox $mailbox"
    //% value.defl="hello"
    //% mailbox.defl="mailbox1"
    //% weight=100 group="Send"
    //% shim=bluetooth::sendTextMessage
    export function sendTextMessage(mailbox: string, value: string): void {
        return;
    }

    /**
     * Send a number to a mailbox on all connected bricks.
     * @param mailbox the mailbox name, eg: "mailbox1"
     * @param value the number to send, eg: 0
     */
    //% blockId=bt_send_number
    //% block="send number $value to mailbox $mailbox"
    //% value.defl=0
    //% mailbox.defl="mailbox1"
    //% weight=90 group="Send"
    //% shim=bluetooth::sendNumberMessage
    export function sendNumberMessage(mailbox: string, value: number): void {
        return;
    }

    /**
     * Send a logic (true/false) value to a mailbox on all connected bricks.
     * @param mailbox the mailbox name, eg: "mailbox1"
     * @param value the logic value to send
     */
    //% blockId=bt_send_logic
    //% block="send logic $value to mailbox $mailbox"
    //% mailbox.defl="mailbox1"
    //% weight=80 group="Send"
    //% shim=bluetooth::sendLogicMessage
    export function sendLogicMessage(mailbox: string, value: boolean): void {
        return;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Receive — event handlers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Run code when a text message is received in the specified mailbox.
     * @param mailbox the mailbox name, eg: "mailbox1"
     * @param handler code to run when a message arrives
     */
    //% blockId=bt_on_text_received
    //% block="on text received $receivedText in mailbox $mailbox"
    //% mailbox.defl="mailbox1"
    //% draggableParameters="reporter"
    //% weight=100 group="Receive"
    export function onTextReceived(mailbox: string, handler: (receivedText: string) => void): void {
        const evSrc = _registerMailboxHandler(mailbox, MailboxDataType.Text);
        if (evSrc < 0) return;
        control.onEvent(evSrc, 0, () => {
            const text = lastTextMessage(mailbox);
            handler(text);
        });
    }

    /**
     * Run code when a number is received in the specified mailbox.
     * @param mailbox the mailbox name, eg: "mailbox1"
     * @param handler code to run when a number arrives
     */
    //% blockId=bt_on_number_received
    //% block="on number received $receivedNumber in mailbox $mailbox"
    //% mailbox.defl="mailbox1"
    //% draggableParameters="reporter"
    //% weight=90 group="Receive"
    export function onNumberReceived(mailbox: string, handler: (receivedNumber: number) => void): void {
        const evSrc = _registerMailboxHandler(mailbox, MailboxDataType.Number);
        if (evSrc < 0) return;
        control.onEvent(evSrc, 0, () => {
            const num = lastNumberMessage(mailbox);
            handler(num);
        });
    }

    /**
     * Run code when a logic value is received in the specified mailbox.
     * @param mailbox the mailbox name, eg: "mailbox1"
     * @param handler code to run when a logic value arrives
     */
    //% blockId=bt_on_logic_received
    //% block="on logic received $receivedLogic in mailbox $mailbox"
    //% mailbox.defl="mailbox1"
    //% draggableParameters="reporter"
    //% weight=80 group="Receive"
    export function onLogicReceived(mailbox: string, handler: (receivedLogic: boolean) => void): void {
        const evSrc = _registerMailboxHandler(mailbox, MailboxDataType.Logic);
        if (evSrc < 0) return;
        control.onEvent(evSrc, 0, () => {
            const logic = lastLogicMessage(mailbox);
            handler(logic);
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Mailbox — read last received value
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Read the last text message received in the specified mailbox.
     * @param mailbox the mailbox name, eg: "mailbox1"
     */
    //% blockId=bt_last_text
    //% block="read text from mailbox $mailbox"
    //% mailbox.defl="mailbox1"
    //% weight=70 group="Mailbox"
    //% shim=bluetooth::lastTextMessage
    export function lastTextMessage(mailbox: string): string {
        return "";
    }

    /**
     * Read the last number received in the specified mailbox.
     * @param mailbox the mailbox name, eg: "mailbox1"
     */
    //% blockId=bt_last_number
    //% block="read number from mailbox $mailbox"
    //% mailbox.defl="mailbox1"
    //% weight=60 group="Mailbox"
    //% shim=bluetooth::lastNumberMessage
    export function lastNumberMessage(mailbox: string): number {
        return 0;
    }

    /**
     * Read the last logic (boolean) value received in the specified mailbox.
     * @param mailbox the mailbox name, eg: "mailbox1"
     */
    //% blockId=bt_last_logic
    //% block="read logic from mailbox $mailbox"
    //% mailbox.defl="mailbox1"
    //% weight=50 group="Mailbox"
    //% shim=bluetooth::lastLogicMessage
    export function lastLogicMessage(mailbox: string): boolean {
        return false;
    }

    /**
     * Internal: register a mailbox receive handler; returns the pxt event source id.
     */
    //% blockHidden=1 shim=bluetooth::_registerMailboxHandler
    export function _registerMailboxHandler(mailbox: string, dataType: number): number {
        return -1;
    }
}
