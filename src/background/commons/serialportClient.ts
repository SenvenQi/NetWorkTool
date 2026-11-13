import { SerialPort } from "serialport";
import { IDisposable } from "./idisposable";
export default abstract class SerialportClient implements IDisposable {
    serialportClient: SerialPort;
    private disposed = false;
    protected constructor(address: string, options?: any) {
        this.serialportClient = new SerialPort({
            baudRate: 9600, stopBits: 1, dataBits: 8, parity: "none",
            ...options, path: address, autoOpen: false,
        });
        this.serialportClient.on("error", error => { if (!this.disposed) this.onError(error); });
        this.serialportClient.on("open", () => { if (!this.disposed) this.onOpen(); });
        this.serialportClient.on("data", data => { if (!this.disposed) this.onData(data); });
        this.serialportClient.on("close", () => { if (!this.disposed) this.onError(new Error("串口已断开")); });
    }
    abstract onError(error: any): void;
    abstract onOpen(): void;
    abstract onData(data: any): void;
    connect() {
        if (!this.disposed && !this.serialportClient.isOpen && !this.serialportClient.opening) this.serialportClient.open();
    }
    send(command: Buffer) {
        if (this.disposed || !this.serialportClient.isOpen) throw new Error("串口未连接");
        this.serialportClient.write(command, error => { if (error && !this.disposed) this.onError(error); });
    }
    dispose() {
        if (this.disposed) return;
        this.disposed = true;
        const port = this.serialportClient;
        if (port.isOpen) port.close();
        else if (port.opening) port.once("open", () => port.close());
    }
}
