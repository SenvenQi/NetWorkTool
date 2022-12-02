import IDevice from "../domains/device";
import {IFilter, IRecivePackage} from '../domains/irecivePackage'
import {DeviceType} from "../domains/deviceType";
import VoiceFilter from "../commands/voice/voiceFilter";
import SerialportClient from "../commons/serialportClient";
import IDeviceOption from "../domains/deviceOption";
import BaseFilter from "../commands/base/baseFilter";
import {MessageType} from "../domains/messageType";

export default class DeviceSerialportClient extends SerialportClient implements IDevice {
    state: boolean = false;
    deviceType: DeviceType =DeviceType.base;
    private readonly pushAction: (data: any) => void;
    address: string;
    private filter: IFilter<IRecivePackage>;

    constructor(deviceOption:IDeviceOption, pushAction: (data: any) => void,removeDeviceClient:(address: string) => void) {
        super(deviceOption.address,deviceOption.options);
        this.address = deviceOption.address;
        this.pushAction = pushAction;
        this.createFilter(deviceOption.deviceType);
    }

    onError(error: any): void {
        this.state = false;
        this.pushAction({type:"RECIVE_MESSAGE",data:{messageType:MessageType.Error,message:{success:false,address:this.address,info:`串口打开失败:${error}`}}})
    }

    onOpen(): void {
        this.state = true;
        this.pushAction({type:"RECIVE_MESSAGE",data:{messageType:MessageType.ChangeState,message:{success:true,address:this.address,messageType:MessageType.ChangeState,info:"串口连接成功"}}})
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
