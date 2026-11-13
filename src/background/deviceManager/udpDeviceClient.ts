
import IDevice from "../domains/device";
import {UdpClient} from "../commons/udpClient";
import IDeviceOption from "../domains/deviceOption";
import {DeviceType} from "../domains/deviceType";
import BaseFilter from "../commands/base/baseFilter";
import {IFilter, IRecivePackage} from "../domains/irecivePackage";
import {MessageType} from "../domains/messageType";

export default class UdpDeviceClient extends UdpClient implements IDevice {
    private filter: IFilter<IRecivePackage>;
    deviceType: DeviceType = DeviceType.base;
    private readonly pushAction: (data: any) => void;

    constructor(deviceOption:IDeviceOption, pushAction: (data: any) => void,removeDeviceClient:(address: string) => void) {
        super(deviceOption.address, deviceOption.options || {});
        this.address = deviceOption.address;
        this.pushAction = pushAction;
        this.createFilter(deviceOption.deviceType);
    }

    address: string;

    onError(error: any): void {
        this.state = false;
        this.pushAction({type:"RECIVE_MESSAGE",data:{messageType:MessageType.Error,message:{success:false,address:this.address,info:`udp出现错误${error}`}}})
    }

    onData(data: any): void {
        const recivePackage = this.filter.filter(data);
        this.pushAction({type:"RECIVE_MESSAGE",data:{messageType:MessageType.Info,message:{time:Date.now(),address:this.address,...recivePackage}}});
    }

    sendMessage(command: Uint8Array): boolean {
        if (!this.state) return false;
        this.send(command);
        return true;
    }

    createFilter(deviceType: DeviceType) {
        switch (deviceType) {
            case DeviceType.base:
                this.filter = new BaseFilter();
                break;
            default:
                this.filter = new BaseFilter();
                break;
        }
    }
    state: boolean = false;

    onOpen(): void {
        this.udpClient.setBroadcast(true)
        this.state = true;
        this.pushAction({type:"RECIVE_MESSAGE",data:{messageType:MessageType.ChangeState,message:{success:true,address:this.address,info:"udp连接成功"}}})
    }
}
