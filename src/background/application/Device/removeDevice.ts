import { IRequsetHandler } from "../../commons/Mediator/irequestHandler";
import {createDecorator, ServiceIdentifier} from "../../commons/dependencyInjection/instantiation";
import { IRequset } from "../../commons/Mediator/irequest";
import {IMainWindowService, IWindowService} from "../../service/windowService";
import {IDeviceManager} from "../../domains/ideviceManager";
import {IDeviceContext} from "../../domains/ideviceContext";

export const IRemoveDeviceRequestHandler = createDecorator<IRequsetHandler<IRequset>>("RemoveDeviceRequestHandler");

export class RemoveDeviceRequest implements IRequset{
    serviceKey: ServiceIdentifier<IRequsetHandler<IRequset>> = IRemoveDeviceRequestHandler;
    readonly address:string
    constructor(_address:string) {
        this.address=_address
    }
}

export class RemoveDeviceRequestHandler implements IRequsetHandler<RemoveDeviceRequest>{
    constructor(@IDeviceContext private deviceRepo:IDeviceContext,
                @IMainWindowService private  windowService:IWindowService,
                @IDeviceManager private deviceManager: IDeviceManager) {
    }
    handle(command: RemoveDeviceRequest): void {
        this.deviceRepo.removeDevice(command.address).then(()=>{
                this.deviceManager.removeDeviceClient(command.address)
                this.windowService.sendMessage({type:"CALL_BACK_REMOVE_DEVICE",data:command.address})
        }).catch((error)=>{
            console.log(error)
        })
    }
}
