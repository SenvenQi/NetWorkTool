import { Client, ClientChannel, SFTPWrapper } from "ssh2";
import { randomUUID } from "crypto";
import { createReadStream, createWriteStream } from "fs";
import { stat, rename, unlink } from "fs/promises";
import path from "path";
import { Transform } from "stream";
import { pipeline } from "stream/promises";
import IDevice from "../domains/device";
import IDeviceOption from "../domains/deviceOption";
import { DeviceChannelType } from "../domains/deviceChannelType";
import { MessageType } from "../domains/messageType";
import { hostFingerprint, remotePath, sshEndpoint, validateSshAuth } from "../commons/sshOptions";
import { ResultMessage } from "../service/windowService";

export function inspectSshHost(address: string, protocol: "ssh" | "sftp"): Promise<string> {
    const endpoint = sshEndpoint(address, protocol);
    return new Promise((resolve, reject) => {
        const client = new Client();
        let fingerprint: string;
        client.on("error", error => { client.destroy(); fingerprint ? resolve(fingerprint) : reject(error); });
        client.on("close", () => { fingerprint ? resolve(fingerprint) : reject(new Error("服务器在提供指纹前断开连接")); });
        client.connect({host: endpoint.host, port: endpoint.port, username: "fingerprint-probe", readyTimeout: 10000,
            hostVerifier: (key: Buffer) => { fingerprint = hostFingerprint(key); return false; }});
    });
}

export default class SshDeviceClient implements IDevice {
    readonly address: string;
    readonly sessionId = randomUUID();
    state = false;
    private client = new Client();
    private channel?: ClientChannel;
    private sftp?: SFTPWrapper;
    private disposed = false;
    private lifetime = new AbortController();
    private sequence = 0;
    private history: Buffer[] = [];
    private historySize = 0;
    private transfer?: {id: string; abort: AbortController};
    private cancelConnect?: (error: Error) => void;
    private ready?: Promise<void>;
    private readonly isSftp: boolean;
    constructor(private options: IDeviceOption, private push: (message: ResultMessage) => void) {
        this.address = options.address;
        this.isSftp = options.deviceChannelType === DeviceChannelType.Sftp;
    }
    private status(success: boolean, info: string, error = false) {
        this.state = success;
        this.push({type: "RECIVE_MESSAGE", data: {messageType: error ? MessageType.Error : MessageType.ChangeState,
            message: {address: this.address, success, info}}});
    }
    connect(): Promise<void> {
        if (this.ready) return this.ready;
        const endpoint = sshEndpoint(this.address, this.isSftp ? "sftp" : "ssh");
        const auth = validateSshAuth(this.options.options?.auth);
        // The saved device options and long-lived client wrapper never retain credentials.
        this.options = {...this.options, options: {}};
        this.ready = new Promise((resolve, reject) => {
            let settled = false;
            const fail = (error: Error) => {
                if (!settled) { settled = true; reject(error); }
                if (!this.disposed) {
                    this.status(false, `SSH/SFTP 连接失败：${error.message}`, true);
                    this.dispose();
                }
            };
            this.cancelConnect = fail;
            this.client.on("error", fail);
            this.client.on("close", () => {
                if (!settled) fail(new Error("连接已关闭"));
                else if (!this.disposed) { this.status(false, "SSH/SFTP 连接已断开"); this.dispose(); }
            });
            const opened = () => {
                if (this.disposed) return;
                settled = true;
                this.cancelConnect = undefined;
                this.status(true, this.isSftp ? "SFTP 连接成功" : "SSH 终端已连接");
                resolve();
            };
            this.client.on("ready", () => {
                if (this.disposed) return;
                if (this.isSftp) {
                    this.client.sftp((error, sftp) => {
                        if (error) { fail(error); return; }
                        if (this.disposed) { sftp.end(); return; }
                        this.sftp = sftp;
                        sftp.on("error", fail);
                        sftp.on("close", () => { if (!this.disposed) fail(new Error("SFTP 会话已关闭")); });
                        opened();
                    });
                } else {
                    this.client.shell({term: "xterm-256color", cols: 80, rows: 24}, (error, channel) => {
                        if (error) { fail(error); return; }
                        if (this.disposed) { channel.close(); return; }
                        this.channel = channel;
                        channel.on("data", (data: Buffer) => this.output(data));
                        channel.stderr.on("data", (data: Buffer) => this.output(data));
                        channel.on("error", fail);
                        channel.on("close", () => { if (!this.disposed) { this.status(false, "SSH 终端已退出"); this.dispose(); } });
                        opened();
                    });
                }
            });
            try {
                this.client.connect({host: endpoint.host, port: endpoint.port, username: auth.username,
                    password: auth.password, privateKey: auth.privateKey, passphrase: auth.passphrase,
                    readyTimeout: 15000, keepaliveInterval: 10000, keepaliveCountMax: 3,
                    hostVerifier: (key: Buffer) => {
                        const matches = hostFingerprint(key) === auth.hostKey;
                        if (!matches) queueMicrotask(() => fail(new Error("服务器指纹已变化，请重新核对后连接")));
                        return matches;
                    }});
            } catch (error) { fail(error as Error); }
        });
        return this.ready;
    }
    private output(data: Buffer) {
        if (this.disposed) return;
        const bytes = Buffer.from(data);
        this.history.push(bytes); this.historySize += bytes.length;
        while (this.historySize > 512 * 1024 && this.history.length > 1) this.historySize -= this.history.shift().length;
        this.push({type: "REMOTE_OUTPUT", data: {address: this.address, sessionId: this.sessionId, sequence: ++this.sequence, bytes}});
    }
    snapshot() { return {sessionId: this.sessionId, sequence: this.sequence, bytes: Buffer.concat(this.history), state: this.state}; }
    sendMessage(command: Uint8Array) {
        if (!this.state || !this.channel || this.disposed) throw new Error("SSH 终端未连接");
        if (command.length > 65536) throw new Error("单次终端输入不能超过 64 KiB");
        this.channel.write(Buffer.from(command));
        return true;
    }
    resize(cols: number, rows: number) {
        if (!Number.isInteger(cols) || !Number.isInteger(rows) || cols < 2 || rows < 1 || cols > 1000 || rows > 500) throw new Error("无效的终端尺寸");
        if (this.state && this.channel) this.channel.setWindow(rows, cols, 0, 0);
    }
    private files() {
        if (!this.state || this.disposed || !this.sftp) throw new Error("SFTP 未连接");
        return this.sftp;
    }
    private request<T>(start: (done: (error?: Error, value?: T) => void) => void, signal?: AbortSignal, timeout = 20000): Promise<T> {
        return new Promise((resolve, reject) => {
            let settled = false;
            const finish = (error?: Error, value?: T) => {
                if (settled) return;
                settled = true; clearTimeout(timer);
                this.lifetime.signal.removeEventListener("abort", cancelled);
                signal?.removeEventListener("abort", cancelled);
                error ? reject(error) : resolve(value as T);
            };
            const cancelled = () => finish(new Error(signal?.aborted ? "传输已取消" : "SFTP 连接已关闭"));
            const timer = setTimeout(() => finish(new Error("SFTP 请求超时")), timeout);
            this.lifetime.signal.addEventListener("abort", cancelled, {once: true});
            signal?.addEventListener("abort", cancelled, {once: true});
            if (this.lifetime.signal.aborted || signal?.aborted) { cancelled(); return; }
            try { start(finish); } catch (error) { finish(error as Error); }
        });
    }
    async list(directory: string) {
        const sftp = this.files();
        const canonical = await this.request<string>(done => sftp.realpath(remotePath(directory), done));
        const entries = await this.request<import("ssh2").FileEntry[]>(done => sftp.readdir(canonical, done));
        return {path: canonical, entries: entries.filter(entry => entry.filename !== "." && entry.filename !== ".." && !entry.filename.includes("/")).map(entry => ({
            name: entry.filename, size: entry.attrs.size, modified: entry.attrs.mtime,
            directory: (entry.attrs.mode & 0o170000) === 0o040000, link: (entry.attrs.mode & 0o170000) === 0o120000,
        })).sort((a, b) => Number(b.directory) - Number(a.directory) || a.name.localeCompare(b.name))};
    }
    async mkdir(directory: string) {
        const sftp = this.files();
        await this.request<void>(done => sftp.mkdir(remotePath(directory), done));
    }
    async rename(from: string, to: string) {
        const sftp = this.files();
        remotePath(from); remotePath(to);
        await this.requireMissing(to);
        await this.request<void>(done => sftp.rename(from, to, done));
    }
    async remove(target: string) {
        const sftp = this.files(); remotePath(target);
        if (["/", ".", ".."].includes(path.posix.normalize(target))) throw new Error("不能删除根目录或当前目录");
        const attrs = await this.request<import("ssh2").Stats>(done => sftp.lstat(target, done));
        await this.request<void>(done => {
            if (attrs.isDirectory()) sftp.rmdir(target, done); else sftp.unlink(target, done);
        });
    }
    private async requireMissing(target: string, signal?: AbortSignal) {
        const sftp = this.files();
        await this.request<void>(done => sftp.lstat(target, error => {
            if ((error as any)?.code === 2) done();
            else done(error || new Error("目标已存在，请使用其他名称"));
        }), signal);
    }
    async transferFile(direction: "upload" | "download", local: string, remote: string) {
        const sftp = this.files(); remotePath(remote);
        if (this.transfer) throw new Error("请等待当前传输完成，或先取消传输");
        const id = randomUUID();
        const abort = new AbortController();
        this.transfer = {id, abort};
        let temporary: string;
        let completed = 0;
        let total = 0;
        let lastProgress = 0;
        const progress = (status: string) => this.push({type: "REMOTE_TRANSFER", data: {address: this.address, id, direction, remote, completed, total, status}});
        progress("running");
        try {
            if (direction === "upload") {
                const info = await stat(local);
                if (!info.isFile()) throw new Error("只能上传普通文件");
                total = info.size;
                await this.requireMissing(remote, abort.signal);
                temporary = path.posix.join(path.posix.dirname(remote), `.networktool-${id}.part`);
            } else {
                const info = await this.request<import("ssh2").Stats>(done => sftp.stat(remote, done), abort.signal);
                if (!info.isFile()) throw new Error("只能下载普通文件");
                total = info.size;
                temporary = `${local}.networktool-${id}.part`;
            }
            if (abort.signal.aborted) throw new Error("传输已取消");
            progress("running");
            const meter = new Transform({transform(chunk, _encoding, callback) {
                completed += chunk.length;
                if (Date.now() - lastProgress > 100) { progress("running"); lastProgress = Date.now(); }
                callback(null, chunk);
            }});
            if (direction === "upload") {
                await pipeline(createReadStream(local), meter, sftp.createWriteStream(temporary, {flags: "wx"}), {signal: abort.signal});
                await this.requireMissing(remote, abort.signal);
                await this.request<void>(done => sftp.rename(temporary, remote, done), abort.signal);
            } else {
                await pipeline(sftp.createReadStream(remote), meter, createWriteStream(temporary, {flags: "wx"}), {signal: abort.signal});
                if (abort.signal.aborted) throw new Error("传输已取消");
                await rename(temporary, local);
            }
            progress("complete");
            return {completed, remote};
        } catch (error) {
            let cleanupFailed = this.disposed;
            if (temporary) {
                if (direction === "download") await unlink(temporary).catch(() => {});
                else if (!this.disposed) await this.request<void>(done => sftp.unlink(temporary, done), undefined, 2000).catch(() => { cleanupFailed = true; });
            }
            progress(abort.signal.aborted ? "cancelled" : "failed");
            const failure = abort.signal.aborted ? new Error("传输已取消") : error as Error;
            if (direction === "upload" && temporary && cleanupFailed) throw new Error(`${failure.message}；远端可能保留临时文件 ${temporary}`);
            throw failure;
        } finally { this.transfer = undefined; }
    }
    cancelTransfer() {
        const transfer = this.transfer;
        transfer?.abort.abort();
        if (transfer && !this.disposed) setTimeout(() => {
            if (this.transfer === transfer && !this.disposed) {
                this.status(false, "远端未响应取消，SFTP 连接已关闭"); this.dispose();
            }
        }, 2500).unref();
    }
    dispose() {
        if (this.disposed) return;
        this.disposed = true; this.state = false;
        this.lifetime.abort();
        this.cancelTransfer();
        this.cancelConnect?.(new Error("连接已取消")); this.cancelConnect = undefined;
        this.channel?.destroy();
        this.sftp?.destroy();
        this.client.destroy();
    }
}
