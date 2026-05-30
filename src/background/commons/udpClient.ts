import { ClientUdpChannel } from "@sevenqi/nodechannel";
import { IDisposable } from "./idisposable";
import PassThroughFilter from "./passThroughFilter";

/**
 * UDP broadcast client backed by @sevenqi/nodechannel's UdpChannel. Binds the
 * configured local port for receiving and broadcasts datagrams to
 * 255.255.255.255:1500, preserving the previous behaviour.
 */
export abstract class UdpClient implements IDisposable {
    private channel?: ClientUdpChannel;
    socketAddress: string;

    protected constructor(address: string) {
        this.socketAddress = address;
    }

    abstract onError(error: any): void;

    abstract onOpen(): void;

    abstract onData(data: any): void;

    connect() {
        this.channel = new ClientUdpChannel(
            {
                host: "255.255.255.255",
                port: 1500,
                localPort: parseInt(this.socketAddress),
                broadcast: true,
            },
            new PassThroughFilter(),
        );
        (this.channel.duplex as any).on("error", this.onError.bind(this));
        this.channel
            .connect()
            .then((connected) => {
                if (!connected) return;
                this.channel!.on("data", this.onData.bind(this));
                this.onOpen();
            })
            .catch((err) => this.onError(err));
    }

    send(command: Uint8Array) {
        this.channel?.send(command);
    }

    dispose() {
        this.channel?.close();
        this.channel = undefined;
    }
}
