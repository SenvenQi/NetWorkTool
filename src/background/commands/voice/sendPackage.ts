import {Buffer} from "buffer";
import {CmdType} from "./cmdType";
import * as iconv from "iconv-lite";

export default class SendPackage{
    header = 0xFD;
    encoding = 0x00;

    private readonly message:string;
    private readonly cmdType:CmdType;

    constructor(cmdType:CmdType,message:string) {
        this.cmdType = cmdType;
        this.message = message;
    }

    static Create(cmdType:CmdType,message:string){
        return new SendPackage(cmdType, cmdType === CmdType.VoiceSynthesis ? message : '');
    }

    getCmd(){
        const messageGBK = iconv.encode(this.message, 'GBK');

        const length = messageGBK.length + (this.cmdType===CmdType.VoiceSynthesis?2:1);

        if (this.cmdType === CmdType.VoiceSynthesis){
            const buffer = Buffer.alloc(5);
            buffer.writeUInt8(this.header);
            buffer.writeUInt16BE(length,1);
            buffer.writeUInt8(this.cmdType,3);
            buffer.writeUInt8(this.encoding,4);
            return Buffer.concat([buffer,messageGBK]);
        }
        else{
            const buffer = Buffer.alloc(4);
            buffer.writeUInt8(this.header);
            buffer.writeUInt16BE(length,1);
            buffer.writeUInt8(this.cmdType,3);
            return Buffer.concat([buffer,messageGBK]);
        }
    }
}


