import IDevice from "../domains/device";
import {IFilter, IRecivePackage} from '../domains/irecivePackage'
import {Buffer} from "buffer";
import {DeviceType} from "../domains/deviceType";
import VoiceFilter from "../commands/voice/voiceFilter";
import socketClient from "../commons/socketClient";
import IDeviceOption from "../domains/deviceOption";
import BaseFilter from "../commands/base/baseFilter";
import {MessageType} from "../domains/messageType";
import {HidClient} from "../commons/hidClient";

export default class HidDeviceClient extends HidClient implements IDevice {

    state: boolean = false;
    deviceType: DeviceType = DeviceType.base;
    private readonly pushAction: (data: any) => void;
    address: string;
    private filter: IFilter<IRecivePackage>;

    constructor(deviceOption:IDeviceOption, pushAction: (data: any) => void,removeDeviceClient:(address: string) => void) {
        super(deviceOption.address);
        this.address = deviceOption.address;
        this.pushAction = pushAction;
        this.createFilter(deviceOption.deviceType);
    }

    onOpen(): void {
        this.state = true;
        this.pushAction({type:"RECIVE_MESSAGE",data:{messageType:MessageType.ChangeState,message:{success:true,address:this.address,info:"hid设备连接成功"}}})
    }

    onError(error: any): void {
        this.state = false;
        this.pushAction({type:"RECIVE_MESSAGE",data:{messageType:MessageType.Error,message:{success:false,address:this.address,info:`hid设备出现错误${error}`}}})
    }

    onData(data: any): void {
        const recivePackage = this.filter.filter(data);
        this.pushAction({type:"RECIVE_MESSAGE",data:{messageType:MessageType.Info,message:{time:Date.now(),address:this.address,...recivePackage}}});
    }

    createFilter(deviceType: DeviceType) {
        switch (deviceType) {
            case DeviceType.base:
                this.filter = new BaseFilter();
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
        if (this.state){
            this.send(command as Buffer);
            return true;
        }
        return false;
    }


}
