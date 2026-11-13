import { Buffer } from "buffer";
export default class SendPackage {
    constructor(private readonly message: string | Uint8Array) {}
    static Create(message: string | Uint8Array) { return new SendPackage(message); }
    getCmd(): Buffer {
        if (this.message instanceof Uint8Array) {
            if (!this.message.length) throw new Error("发送内容不能为空");
            return Buffer.from(this.message);
        }
        if (typeof this.message !== "string") throw new Error("无效的发送内容");
        const hex = this.message.replace(/\s/g, "");
        if (!hex || !/^(?:[0-9a-fA-F]{2})+$/.test(hex)) throw new Error("请输入完整的十六进制字节");
        return Buffer.from(hex, "hex");
    }
}
