import { createHash } from "crypto";
import { parsePort } from "./endpoint";

export function sshEndpoint(address: string, protocol: "ssh" | "sftp") {
    if (typeof address !== "string" || !address.trim()) throw new Error("请输入服务器地址");
    let url: URL;
    try { url = new URL(address.includes("://") ? address.trim() : `${protocol}://${address.trim()}`); }
    catch { throw new Error("SSH/SFTP 地址格式应为 host:port 或 [IPv6]:port"); }
    if (url.protocol !== `${protocol}:` || url.username || url.password || url.search || url.hash || (url.pathname && url.pathname !== "/")) {
        throw new Error("地址只能包含服务器和端口，用户名请单独填写");
    }
    const host = url.hostname.replace(/^\[|\]$/g, "");
    if (!host || /\s/.test(host)) throw new Error("无效的服务器地址");
    const port = parsePort(url.port || "22");
    return {host, port, address: `${protocol}://${host.includes(":") ? `[${host}]` : host}:${port}`};
}
export function hostFingerprint(key: Buffer) {
    return `SHA256:${createHash("sha256").update(key).digest("base64").replace(/=+$/, "")}`;
}
export interface SshAuth { username: string; password?: string; privateKey?: string; passphrase?: string; hostKey: string; }
export function validateSshAuth(auth: any): SshAuth {
    if (!auth || typeof auth.username !== "string" || !auth.username.trim() || auth.username.length > 256) throw new Error("请输入 SSH 用户名");
    if (typeof auth.hostKey !== "string" || !/^SHA256:[A-Za-z0-9+/]{43}$/.test(auth.hostKey)) throw new Error("请先核对服务器指纹");
    if (typeof auth.privateKey === "string" && auth.privateKey.trim()) {
        if (auth.privateKey.length > 1024 * 1024 || (auth.passphrase !== undefined && typeof auth.passphrase !== "string")) throw new Error("无效的私钥或口令");
        return {username: auth.username.trim(), hostKey: auth.hostKey, privateKey: auth.privateKey, passphrase: auth.passphrase || undefined};
    }
    if (typeof auth.password !== "string" || !auth.password.length || auth.password.length > 65536) throw new Error("请输入密码或私钥");
    return {username: auth.username.trim(), hostKey: auth.hostKey, password: auth.password};
}
export function remotePath(value: unknown): string {
    if (typeof value !== "string" || !value || value.length > 4096 || value.includes("\0")) throw new Error("无效的远端路径");
    return value;
}
