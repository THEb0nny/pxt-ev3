/// <reference path="../node_modules/pxt-core/localtypings/pxteditor.d.ts"/>
/// <reference path="../node_modules/pxt-core/built/pxtsim.d.ts"/>

import { Ev3Wrapper } from "./wrap";
import { bluetoothTryAgainAsync } from "./dialogs";
import { WebSerialIO } from "./webserial";


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
        if (this.state === TransportState.Connected && this.wrapper) return this.wrapper;
        // Если уже идёт подключение — возвращаем тот же Promise
        if (this.connectPromise) return this.connectPromise;

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
                this.state = TransportState.Unpaired;
                throw e;
            }
            if (e?.message === "PORT_PERMISSION_DENIED") {
                this.state = TransportState.Idle;
                throw e;
            }
            // Порт открылся, но EV3 не ответил на PING
            if (e?.message === "Timeout") {
                console.warn("SERIAL: EV3 PING timeout");
                console.warn("SERIAL: selected port did not respond to EV3 PING");
                this.state = TransportState.Unpaired;
                throw new Error("INVALID_EV3_PORT");
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

    async disconnectAsync(unpaired: boolean = false) {
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

    async hardResetAsync() {
        console.log("SERIAL: HARD RESET");
        try { await this.disconnectAsync(); } catch {}
        this.state = TransportState.Idle;
    }

}

export const transport = new TransportManager();