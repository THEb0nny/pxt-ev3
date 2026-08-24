/// <reference path="../node_modules/pxt-core/localtypings/pxteditor.d.ts"/>
/// <reference path="../node_modules/pxt-core/built/pxtsim.d.ts"/>


enum IOState {
    Disconnected,
    Connecting,
    Connected
}

export class WebSerialIO implements pxt.packetio.PacketIO {

    onData = (v: Uint8Array) => {};
    onEvent = (v: Uint8Array) => {};
    onError = (e: Error) => {};
    error = (msg: string) => {};
    onConnectionChanged = () => {};
    onDeviceConnectionChanged = () => {};

    private reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
    private writer: WritableStreamDefaultWriter<Uint8Array> | undefined;
    
    private state: IOState = IOState.Disconnected;

    constructor(private port: any) {
        console.log("SERIAL: New WebSerialIO");
    }

    static supported(): boolean {
        return !!(navigator as any).serial;
    }

    isConnected() {
        return this.state === IOState.Connected;
    }

    isConnecting() {
        return this.state === IOState.Connecting;
    }

    static async createAsync(forceRequest: boolean): Promise<WebSerialIO> {
        const serial = (navigator as any).serial;
        if (!serial) throw new Error("WEBSERIAL_NOT_SUPPORTED");

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
                port = await serial.requestPort({});
            } catch (e: any) {
                // Пользователь закрыл окно выбора порта
                if (e?.name === "NotFoundError") {
                    throw new Error("NO_PORT_SELECTED");
                }
                // Пользователь запретил доступ
                if (e?.name === "SecurityError") {
                    throw new Error("PORT_PERMISSION_DENIED");
                }
                throw e;
            }
        }

        return new WebSerialIO(port);
    }

    async reconnectAsync(): Promise<void> {
        if (this.state === IOState.Connected) return; // Порт уже открыт — не трогаем, т.к. Timeout не означает разрыв
        if (this.state === IOState.Connecting) throw new Error("CONNECT_IN_PROGRESS");

        this.state = IOState.Connecting;

        try {
            await this.port.open({ baudRate: 460800, bufferSize: 4096 });
            this.state = IOState.Connected;
            this.onConnectionChanged();
            this.startReader();
        } catch (e: any) {
            this.state = IOState.Disconnected;
            if (e?.name === "NetworkError") {
                throw new Error("PORT_OPEN_FAILED");
            }
            if (e?.name === "SecurityError") {
                throw new Error("PORT_PERMISSION_DENIED");
            }
            throw e;
        }
    }

    async disconnectAsync(): Promise<void> {
        if (this.state === IOState.Disconnected) return;

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
            console.warn("SERIAL: close error", e);
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

                buffer = buffer
                    ? pxt.U.uint8ArrayConcat([buffer, value])
                    : value;

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