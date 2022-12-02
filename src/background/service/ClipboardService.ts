import { clipboard } from 'electron'
import {createDecorator} from "../commons/dependencyInjection/instantiation";
import {Buffer} from "buffer";

export const IClipboardService = createDecorator<ClipboardService>("ClipborardService");
export class ClipboardService {
    constructor() {
    }

    copy(text:Buffer):void{
        clipboard.writeText(`{${Array.prototype.map.call(text, (x:number) => '0x' + (('00' + x.toString(16)).slice(-2))).join(',')}}`)
    }

    read(text:string):string{
        return  clipboard.readText();
    }
}
