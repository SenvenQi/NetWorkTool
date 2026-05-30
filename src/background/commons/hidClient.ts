import { HidChannel } from "@sevenqi/nodechannel";
import { IDisposable } from "./idisposable";
import PassThroughFilter from "./passThroughFilter";

/**
 * HID client backed by @sevenqi/nodechannel's HidChannel. Same public surface
 * as before so the deviceManager HID subclass is unaffected.
 */
export abstract class HidClient implements IDisposable {
    private channel?: HidChannel;
    private readonly path: string;

    protected constructor(path: string) {
        this.path = path;
    }

    abstract onError(error: any): void;
    abstract onOpen(): void;
    abstract onData(data: any): void;

    connect() {
        this.channel = new HidChannel(this.path, new PassThroughFilter());
        this.channel
            .connect()
            .then((opened) => {
                if (!opened) return;
                (this.channel!.duplex as any).on("error", this.onError.bind(this));
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
