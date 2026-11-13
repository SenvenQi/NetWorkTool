import { Socket } from "net";
import { IDisposable } from "./idisposable";
import { parseEndpoint } from "./endpoint";
export default abstract class SocketClient implements IDisposable {
    private socket?: Socket;
    protected constructor(private socketAddress: string, options?: any) {}
    abstract onError(error: any): void;
    abstract onConnect(data?: any): void;
    abstract onData(data: any): void;
    protected onClose() {}
    connect() {
        if (this.socket && !this.socket.destroyed) return;
        const { host, port } = parseEndpoint(this.socketAddress);
        const socket = new Socket();
        this.socket = socket;
        socket.setKeepAlive(true);
        socket.setTimeout(10000);
        socket.on("error", error => { if (this.socket === socket) this.onError(error); });
        socket.on("connect", () => {
            socket.setTimeout(0);
            if (this.socket === socket) this.onConnect();
        });
        socket.on("data", data => { if (this.socket === socket) this.onData(data); });
        socket.on("close", () => {
            if (this.socket !== socket) return;
            this.socket = undefined;
            this.onClose();
        });
        socket.on("timeout", () => socket.destroy(new Error("连接超时")));
        socket.connect(port, host);
    }
    send(command: Uint8Array) {
        if (!this.socket || this.socket.destroyed || this.socket.connecting) throw new Error("TCP 未连接");
        this.socket.write(command);
    }
    dispose() {
        const socket = this.socket;
        this.socket = undefined;
        socket?.destroy();
    }
}
