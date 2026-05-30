import { ClientTcpChannel } from "@sevenqi/nodechannel";
import { IDisposable } from "./idisposable";
import PassThroughFilter from "./passThroughFilter";

/**
 * TCP client backed by @sevenqi/nodechannel's TcpChannel. The public surface
 * (onError/onConnect/onData/onClose/connect/send/dispose) is unchanged so the
 * existing deviceManager subclasses keep working.
 */
export default abstract class SocketClient implements IDisposable {

    private channel?: ClientTcpChannel;
    private readonly socketAddress: string;

    protected constructor(address: string, options?: any) {
        this.socketAddress = address;
    }

    abstract onError(has_error: any): void;

    abstract onConnect(data: any): void;

    abstract onData(data: any): void;

    protected onTimeout() {

    }

    protected onClose() {
        // Channel teardown is handled by dispose()/close(); kept so subclasses
        // can override (e.g. to trigger removeDeviceClient on disconnect).
    }

    connect() {
        const addressWithPort = this.socketAddress.split(':');
        this.channel = new ClientTcpChannel(
            { host: addressWithPort[0], port: parseInt(addressWithPort[1]) },
            new PassThroughFilter(),
        );
        const socket = this.channel.duplex as any;
        socket.setKeepAlive(true);
        socket.setTimeout(10000);
        this.channel.onClose = this.onClose.bind(this);
        this.channel
            .connect()
            .then((connected) => {
                if (!connected) return;
                socket.on('error', this.onError.bind(this));
                socket.on('timeout', this.onTimeout.bind(this));
                this.channel!.on('data', this.onData.bind(this));
                this.onConnect(undefined);
            })
            .catch((err) => this.onError(err));
    }

    send(command: Uint8Array) {
        this.channel?.send(command);
    }

    dispose(): void {
        this.channel?.close();
        this.channel = undefined;
    }
}
