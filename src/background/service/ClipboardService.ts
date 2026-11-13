import { clipboard } from 'electron'
import {createDecorator} from "../commons/dependencyInjection/instantiation";
import {Buffer} from "buffer";

export const IClipboardService = createDecorator<ClipboardService>("ClipborardService");
export class ClipboardService {
    constructor() {
    }

    async copy(text:Buffer | string):Promise<void>{
        if (typeof text === "string") { await clipboard.writeText(text); return; }
        await clipboard.writeText(`{${Array.prototype.map.call(text, (x:number) => '0x' + (('00' + x.toString(16)).slice(-2))).join(',')}}`)
    }

    async read():Promise<string>{
        return  clipboard.readText();
    }
}
