import * as http from "http";
import { unlink } from "fs/promises";
import { IDisposable } from "./idisposable";
import formidable from "formidable";
export default abstract class HttpServer implements IDisposable {
    private httpServer?: http.Server;
    private connections = new Set<import("net").Socket>();
    protected constructor(private readonly port: number) {}
    protected onError(error: any) {}
    protected onRequestError(error: any) {}
    abstract onConnect(data?: any): void;
    abstract onData(data: any): void;
    private requestHandler(req: http.IncomingMessage, res: http.ServerResponse, isCurrent: () => boolean) {
        const limit = 1024 * 1024;
        const finish = (status: number, text: string) => {
            if (!res.writableEnded && !res.destroyed) { res.writeHead(status, {"Content-Type": "text/plain; charset=utf-8"}); res.end(text); }
        };
        req.on("error", error => { if (isCurrent()) this.onRequestError(error); finish(400, "Invalid request"); });
        if (req.headers["content-type"]?.split(";", 1)[0].trim().toLowerCase() === "multipart/form-data") {
            const uploads: string[] = [];
            const form = formidable({ maxFileSize: limit, maxTotalFileSize: limit, maxFiles: 10, maxFieldsSize: limit, maxFields: 100 });
            form.on("fileBegin", (_name, file) => uploads.push(file.filepath));
            form.parse(req, (error, fields, files) => {
                try {
                    if (error) finish(400, "Invalid multipart request");
                    else if (isCurrent()) { this.onData(JSON.stringify({ fields, files })); finish(200, "OK!"); }
                } finally {
                    for (const file of uploads) void unlink(file).catch(() => {});
                }
            });
            return;
        }
        const chunks: Buffer[] = [];
        let size = 0;
        req.on("data", (chunk: Buffer) => {
            size += chunk.length;
            if (size > limit) { chunks.length = 0; finish(413, "Request too large"); }
            else chunks.push(chunk);
        });
        req.on("end", () => {
            if (size > limit || !isCurrent()) return;
            this.onData(Buffer.concat(chunks).toString("utf8"));
            finish(200, "OK!");
        });
    }
    connect() {
        if (this.httpServer) return;
        const server: http.Server = http.createServer((req, res) => this.requestHandler(req, res, () => this.httpServer === server));
        this.httpServer = server;
        server.on("error", error => { if (this.httpServer === server) this.onError(error); });
        server.on("listening", () => { if (this.httpServer === server) this.onConnect(); });
        server.on("connection", socket => {
            if (this.httpServer !== server) { socket.destroy(); return; }
            this.connections.add(socket);
            socket.on("close", () => this.connections.delete(socket));
        });
        server.setTimeout(30000);
        server.on("timeout", (socket: import("net").Socket) => socket.destroy());
        server.listen(this.port);
    }
    dispose() {
        const server = this.httpServer;
        this.httpServer = undefined;
        for (const socket of this.connections) socket.destroy();
        this.connections.clear();
        server?.close();
    }
}
