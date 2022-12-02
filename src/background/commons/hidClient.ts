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
        this.hidClient.on('error', this.onError.bind(this))
        this.hidClient.on('data', this.onData.bind(this))
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
        this.hidClient.close()
        delete this.hidClient;
    }

}
