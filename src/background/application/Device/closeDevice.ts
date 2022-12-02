import { IRequsetHandler } from "../../commons/Mediator/irequestHandler";
import { createDecorator, ServiceIdentifier } from "../../commons/dependencyInjection/instantiation";
import { IRequset } from "../../commons/Mediator/irequest";
import { IDeviceManager } from "../../domains/ideviceManager";
import {IDeviceContext} from "../../domains/ideviceContext";

export const ICloseDeviceRequestHandler = createDecorator<IRequsetHandler<IRequset>>("CloseDeviceRequestHandler");

export class CloseDeviceRequest implements IRequset {
    serviceKey: ServiceIdentifier<IRequsetHandler<IRequset>> = ICloseDeviceRequestHandler;
    readonly address: string
    constructor(_address: string) {
        this.address = _address
    }
}

export class CloseDeviceRequestHandler implements IRequsetHandler<CloseDeviceRequest>{
    constructor(@IDeviceContext private deviceRepo:IDeviceContext ,
        @IDeviceManager private deviceManager: IDeviceManager) {
    }
    handle(command: CloseDeviceRequest): void {
        this.deviceRepo.getDevice(command.address).then((device) => {
            if (!device) return
            this.deviceManager.removeDeviceClient(command.address)
        }).catch((error)=>{
            console.log(error)
        })
    }
}
