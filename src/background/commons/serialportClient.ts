import SerialPort, {OpenOptions} from "serialport";
import {IDisposable} from "./idisposable";


export default abstract class SerialportClient implements IDisposable {
    serialportClient: SerialPort;

    protected constructor(address:string, options?:OpenOptions) {
        if (options)
            this.serialportClient = new SerialPort(address,{...options,autoOpen:false});
        else
            this.serialportClient = new SerialPort(address, {
                baudRate:9600,
                stopBits:1,
                dataBits:8,
                parity:'none',
                autoOpen: false
            })
        this.init();
    }

    abstract onError(error:any):void;
    abstract onOpen():void;
    abstract onData(data:any):void;

    private init(): void {
        this.serialportClient.on('error', this.onError.bind(this))
        this.serialportClient.on('open', this.onOpen.bind(this))
        this.serialportClient.on('data', this.onData.bind(this))
    }

    connect() {
        this.serialportClient.open();
    }

    public send(command: Buffer) {
        this.serialportClient.write(command,err=>{
            if (err)
                this.serialportClient.emit("error")
        })
    }

    dispose(): void {
        this.serialportClient.close((error => {
            if (error) {
                //console.log(error)
            }else{
                this.serialportClient.destroy();
            }
            delete this.serialportClient;
        }))
    }
}
