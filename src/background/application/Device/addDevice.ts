import { IRequsetHandler } from "../../commons/Mediator/irequestHandler";
import { createDecorator, ServiceIdentifier } from "../../commons/dependencyInjection/instantiation";
import { IRequset } from "../../commons/Mediator/irequest";
import { DeviceType } from "../../domains/deviceType";
import { DeviceChannelType } from "../../domains/deviceChannelType";
import { IMainWindowService, IWindowService } from "../../service/windowService";
import { IDeviceContext } from "../../domains/ideviceContext";

export const IAddDeviceRequestHandler = createDecorator<IRequsetHandler<IRequset>>("AddDeviceRequestHandler");

export class AddDeviceRequest implements IRequset {
    serviceKey: ServiceIdentifier<IRequsetHandler<IRequset>> = IAddDeviceRequestHandler;
    readonly name: string
    readonly option?: any
    readonly address: string
    readonly type: DeviceType
    readonly channelType: DeviceChannelType

    constructor(name: string, address: string, option: any, deviceType:DeviceType, deviceChannelType: DeviceChannelType) {
        this.name = name
        this.address = address
        this.option = option
        this.type = deviceType
        this.channelType = deviceChannelType
    }
}

export class AddDeviceRequestHandler implements IRequsetHandler<AddDeviceRequest>{
    constructor( @IMainWindowService private windowService: IWindowService,
                 @IDeviceContext private deviceRepo:IDeviceContext ) {
    }
    handle(command: AddDeviceRequest): void {
        const device = {
            name: command.name,
            address: command.address,
            option: command.option?JSON.stringify(command.option):"",
            type: command.type,
            channelType: command.channelType
        }
        this.deviceRepo.addDevice(command.name,command.address,JSON.stringify(command.option),command.type,command.channelType).then(()=>{
                this.windowService.sendMessage({type:"CALL_BACK_ADD_DEVICE",data:device})
        }).catch((error)=>{
            console.log(error)
        });
    }
}
