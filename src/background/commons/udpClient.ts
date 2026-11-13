import * as dgram from "dgram";
import { IDisposable } from "./idisposable";
import { parsePort } from "./endpoint";
export abstract class UdpClient implements IDisposable {
    udpClient: dgram.Socket;
    protected constructor(private socketAddress: string, private options: { remoteAddress?: string; remotePort?: number } = {}) {}
    abstract onError(error: any): void;
    protected onSendError(error: any) { this.onError(error); }
    abstract onOpen(): void;
    abstract onData(data: any): void;
    connect() {
        if (this.udpClient) return;
        const port = parsePort(this.socketAddress);
        const socket = dgram.createSocket("udp4");
        this.udpClient = socket;
        socket.on("listening", () => { if (this.udpClient === socket) this.onOpen(); });
        socket.on("error", error => { if (this.udpClient === socket) this.onError(error); });
        socket.on("message", data => { if (this.udpClient === socket) this.onData(data); });
        socket.bind(port);
    }
    send(command: Uint8Array) {
        if (!this.udpClient) throw new Error("UDP 未连接");
        const socket = this.udpClient;
        socket.send(command, this.options.remotePort ?? 1500, this.options.remoteAddress || "255.255.255.255", error => {
            if (error && this.udpClient === socket) this.onSendError(error);
        });
    }
    dispose() {
        const socket = this.udpClient;
        delete this.udpClient;
        if (socket) {
            try { socket.close(); } catch (error) {
                if ((error as NodeJS.ErrnoException).code !== "ERR_SOCKET_DGRAM_NOT_RUNNING") throw error;
            }
        }
    }
}
