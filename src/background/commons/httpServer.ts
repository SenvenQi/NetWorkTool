import { HttpServer as NodeChannelHttpServer } from "@sevenqi/nodechannel";
import { IDisposable } from "./idisposable";

/**
 * HTTP server backed by @sevenqi/nodechannel's HttpServer. Behaviour matches
 * the previous local implementation: each inbound request body is surfaced via
 * onData (multipart/form-data parsed to `{ fields, files }` JSON, other bodies
 * as raw text) and every request is answered with 200 OK.
 */
export default abstract class HttpServer implements IDisposable {
    private server?: NodeChannelHttpServer;
    private readonly port: number;

    protected constructor(port: number) {
        this.port = port;
    }

    protected onError(has_error: any) {

    }

    abstract onConnect(data: any): void;

    abstract onData(data: any): void;

    protected onTimeout() {

    }

    connect() {
        this.server = new NodeChannelHttpServer({ port: this.port });
        this.server.onServerData((data: any) => this.onData(data));
        this.server.onError = (err: any) => this.onError(err);
        this.server.onListening = () => this.onConnect(undefined);
        this.server.listen();
    }

    dispose(): void {
        this.server?.disListen();
        this.server = undefined;
    }
}
