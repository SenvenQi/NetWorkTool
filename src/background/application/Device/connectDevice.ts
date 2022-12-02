import { IRequsetHandler } from "../../commons/Mediator/irequestHandler";
import { createDecorator, ServiceIdentifier } from "../../commons/dependencyInjection/instantiation";
import { IRequset } from "../../commons/Mediator/irequest";
import { IDeviceManager } from "../../domains/ideviceManager";
import {IDeviceContext} from "../../domains/ideviceContext";

export const IConnectDeviceRequestHandler = createDecorator<IRequsetHandler<IRequset>>("ConnectDeviceRequestHandler");

export class ConnectDeviceRequest implements IRequset {
    serviceKey: ServiceIdentifier<IRequsetHandler<IRequset>> = IConnectDeviceRequestHandler;
    readonly deivce: any
    constructor(_deivce: any) {
        this.deivce = _deivce
    }
}

export class ConnectDeviceRequestHandler implements IRequsetHandler<ConnectDeviceRequest>{
    constructor(@IDeviceContext private deviceRepo:IDeviceContext,
        @IDeviceManager private deviceManager: IDeviceManager) {
    }
    handle(command: ConnectDeviceRequest): void {
        this.deviceRepo.getDevice(command.deivce.address).then((device) => {
            if (!device) return
            this.deviceManager.addDeviceClient({
                deviceType: device.type,
                deviceChannelType: device.channelType,
                address:device.address,
                options:device.option != ""? JSON.parse(device.option):""
            })
        }).catch((error)=>{
            console.log(error)
        })
    }
}
