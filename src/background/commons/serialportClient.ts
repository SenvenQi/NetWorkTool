import { SerialChannel } from "@sevenqi/nodechannel";
import { IDisposable } from "./idisposable";
import PassThroughFilter from "./passThroughFilter";

/**
 * Serial client backed by @sevenqi/nodechannel's SerialChannel. The channel
 * uses serialport v10's options object (`{ path, baudRate, ... }`), so the
 * incoming address is mapped to `path` and the previous defaults are kept.
 */
export default abstract class SerialportClient implements IDisposable {
    private channel?: SerialChannel;
    private readonly path: string;
    private readonly options?: any;

    protected constructor(address: string, options?: any) {
        this.path = address;
        this.options = options;
    }

    abstract onError(error: any): void;
    abstract onOpen(): void;
    abstract onData(data: any): void;

    connect() {
        const openOptions = {
            baudRate: 9600,
            stopBits: 1,
            dataBits: 8,
            parity: "none",
            ...(this.options || {}),
            path: this.path,
            autoOpen: false,
        };
        this.channel = new SerialChannel(openOptions as any, new PassThroughFilter());
        const port = this.channel.duplex as any;
        this.channel
            .connect()
            .then((opened) => {
                if (!opened) return;
                port.on("error", this.onError.bind(this));
                this.channel!.on("data", this.onData.bind(this));
                this.onOpen();
            })
            .catch((err) => this.onError(err));
    }

    public send(command: Buffer) {
        this.channel?.send(command);
    }

    dispose(): void {
        this.channel?.close();
        this.channel = undefined;
    }
}
