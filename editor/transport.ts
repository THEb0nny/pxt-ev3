/// <reference path="../node_modules/pxt-core/localtypings/pxteditor.d.ts"/>
/// <reference path="../node_modules/pxt-core/built/pxtsim.d.ts"/>

import { Ev3Wrapper } from "./wrap";
import { WebSerialIO } from "./webserial";
import { showBluetoothConnectionStuckDialogAsync } from "./dialogs";


enum TransportState {
    Unpaired, // No port is selected. A new port must be selected on the next connection attempt
    Idle, // The transport is disconnected but can reconnect using the selected port
    Connecting, // A connection attempt is in progress
    Connected, // The transport is connected and ready to use
    Disconnecting, // The current connection is being closed
    FatalError // An unrecoverable transport error has occurred
}

class TransportManager {

    private state = TransportState.Unpaired;
    private wrapper?: Ev3Wrapper;
    private io?: WebSerialIO;

    // Stores the current connection attempt to prevent multiple simultaneous connectAsync() calls from creating or opening more than one connection
    private connectPromise?: Promise<Ev3Wrapper>;

    /**
     * Connects to the EV3 and returns a ready-to-use wrapper.
     *
     * If the transport is already connected, the existing wrapper is returned.
     * If another connection attempt is already in progress, the same Promise is returned instead of starting a second connection.
     */
    async connectAsync(): Promise<Ev3Wrapper> {
        if (this.state === TransportState.Connected && this.wrapper) return this.wrapper; // Already connected
        if (this.connectPromise) return this.connectPromise; // If a connection is already in progress, we return the same Promise

        this.connectPromise = this.doConnectAsync();
        try {
            return await this.connectPromise;
        } finally {
            this.connectPromise = undefined;
        }
    }

    /**
     * Performs a single connection attempt.
     *
     * If no WebSerialIO exists, a new connection is created.
     * Otherwise, the existing IO object is reconnected.
     *
     * Known connection errors update the transport state accordingly.
     * The method does not retry failed connections automatically.
     * A new connection attempt is started by the next connectAsync() call.
     */
    private async doConnectAsync(): Promise<Ev3Wrapper> {
        // if (!WebSerialIO.supported()) {
        //     this.state = TransportState.FatalError;
        //     throw new Error("WEBSERIAL_NOT_SUPPORTED");
        // }

        try {
            // Don't create a new IO if it already exists
            if (!this.io) {
                const force = this.state === TransportState.Unpaired;
                this.io = await WebSerialIO.createAsync(force);
            }

            this.state = TransportState.Connecting;
            await this.io.reconnectAsync();
            if (!this.wrapper) { // If the wrapper is not yet available, create it
                this.wrapper = new Ev3Wrapper(this.io);
            }

            this.state = TransportState.Connected;
            return this.wrapper;
        } catch (e: any) {
            if (e?.message === "Timeout") { // The port opened, but the EV3 did not respond to PING
                console.warn("SERIAL: EV3 PING timeout. Selected port did not respond.");
                this.state = TransportState.Unpaired;
                throw new Error("EV3_RESPONSE_TIMEOUT");
            }
            if (e?.message === "NO_PORT_SELECTED") { // The user closed the port selection window
                this.state = TransportState.Unpaired;
                throw e;
            }
            if (e?.message === "PORT_PERMISSION_DENIED") {
                this.state = TransportState.Idle;
                // this.state = TransportState.Unpaired;
                throw e;
            }
            if (e?.message === "PORT_OPEN_FAILED") {
                console.warn("Bluetooth connection is stuck. Windows did not release the RFCOMM channel. Please reset Bluetooth or re-enable the COM port.");
                
                if (this.io) { // Destroy the old IO if it exists
                    try {
                        await this.io.disconnectAsync();
                    } catch {}
                    this.io = undefined;
                    this.wrapper = undefined;
                }
                this.state = TransportState.Unpaired;
                await showBluetoothConnectionStuckDialogAsync();
                throw e;
            }

            // WEBSERIAL_NOT_SUPPORTED or other unknown transport error
            this.state = TransportState.FatalError;
            throw e;
        }
    }

    /**
     * Disconnects the current Web Serial connection and releases all transport resources.
     *
     * The io and wrapper instances are always cleared after the disconnect attempt.
     * By default the transport becomes Idle. When unpaired is true, the transport becomes Unpaired so the next connection requires selecting a serial port again.
     */
    async disconnectAsync(unpaired: boolean) {
        if (!this.io) {
            this.state = unpaired ? TransportState.Unpaired : TransportState.Idle;
            
            return;
        }

        this.state = TransportState.Disconnecting;

        try {
            await this.io.disconnectAsync();
        } finally {
            this.io = undefined;
            this.wrapper = undefined;
            this.state = unpaired ? TransportState.Unpaired : TransportState.Idle;
        }
    }

}

export const transport = new TransportManager();