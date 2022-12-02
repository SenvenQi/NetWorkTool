import {Socket} from 'net';
import {IDisposable} from "./idisposable";

export default abstract class SocketClient implements IDisposable {

    private socket: Socket;
    private socketAddress:string;

    protected constructor(address:string, options?: any) {
        this.socketAddress = address;
    }

    abstract onError(has_error:any):void;

    abstract onConnect(data:any):void;

    abstract onData(data:any):void;

    protected onTimeout(){

    }

    protected onClose(){
        if(this.socket){
            this.socket.destroy();
            delete this.socket;
        }


        //console.log("正在重连......")
        //this.connect();
    }

    private init(): void {
        this.socket = new Socket();
        this.socket.setKeepAlive(true)
        this.socket.setTimeout(10000)
        this.socket.on("error", this.onError.bind(this))
        this.socket.on("connect", this.onConnect.bind(this))
        this.socket.on("data", this.onData.bind(this))
        this.socket.on("close", this.onClose.bind(this))
        this.socket.on("timeout", this.onTimeout.bind(this))
    }

    connect() {
        this.init();
        const addressWithPort = this.socketAddress.split(':');
        this.socket.connect(parseInt(addressWithPort[1]),addressWithPort[0]);
    }

    send(command: Uint8Array) {
        this.socket.write(command,err=>{
            if (err)
                this.socket.emit("error",err)
        })
    }

    dispose(): void {
        if (this.socket){
            if(this.socket){
                this.socket.destroy();
                delete this.socket;
            }
        }
    }
}
