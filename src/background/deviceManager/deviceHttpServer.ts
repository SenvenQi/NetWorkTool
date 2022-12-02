import IDevice from "../domains/device";
import {IFilter, IRecivePackage} from '../domains/irecivePackage'
import {DeviceType} from "../domains/deviceType";
import VoiceFilter from "../commands/voice/voiceFilter";
import IDeviceOption from "../domains/deviceOption";
import {MessageType} from "../domains/messageType";
import HttpServer from "../commons/httpServer";
import HttpFilter from "../commands/http/httpFilter";

export default class DeviceHttpServer extends HttpServer implements IDevice {

    state: boolean = false;
    deviceType: DeviceType = DeviceType.base;
    private readonly pushAction: (data: any) => void;
    address: string;
    private filter: IFilter<IRecivePackage>;

    constructor(deviceOption:IDeviceOption, pushAction: (data: any) => void,removeDeviceClient:(address: string) => void) {
        super(parseInt(deviceOption.address));
        this.address = deviceOption.address;
        this.pushAction = pushAction;
        this.createFilter(deviceOption.deviceType);
    }

    onError(error: any): void {
        this.state = false;
        this.pushAction({type:"RECIVE_MESSAGE",data:{messageType:MessageType.Error,message:{success:false,address:this.address,info:`http监听错误:${error}`}}})
    }

    onConnect(data: any): void {
        this.state = true;
        this.pushAction({type:"RECIVE_MESSAGE",data:{messageType:MessageType.ChangeState,message:{success:true,address:this.address,info:"http监听开启成功"}}})
    }
    onData(data: any): void {
        const recivePackage = this.filter.filter(data);
        this.pushAction({type:"RECIVE_MESSAGE",data:{messageType:MessageType.Info,message:{time:Date.now(),address:this.address,...recivePackage}}});
    }

    createFilter(deviceType: DeviceType) {
        switch (deviceType) {
            case DeviceType.base:
                this.filter = new HttpFilter();
                break;
            case DeviceType.voice:
                this.filter = new VoiceFilter();
                break;
            default:
                this.filter = null;
                break;
        }
    }

    sendMessage(command: Uint8Array) {
        console.log("httpserver 无发送功能")
        return false;
    }
}
