import { HID } from "node-hid";
import {IDisposable} from "./idisposable";


export abstract class HidClient implements IDisposable{
    private readonly path:string;
    private hidClient: HID
    protected constructor(path:string) {
        this.path = path;
    }

    abstract onError(error:any):void;
    abstract onOpen():void;
    abstract onData(data:any):void;

    private init(): void {
        const client = this.hidClient;
        client.on('error', error => { if (this.hidClient === client) this.onError(error); });
        client.on('data', data => { if (this.hidClient === client) this.onData(data); });
    }

    connect() {
        this.hidClient = new HID(this.path)
        this.init()
        this.onOpen()
    }

    public send(command: Buffer) {
        this.hidClient.write(command)
    }

    dispose(): void {
        const client = this.hidClient;
        delete this.hidClient;
        client?.close();
    }

}
