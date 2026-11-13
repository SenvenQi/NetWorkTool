import {IRequset} from "../../commons/Mediator/IRequest";
import {createDecorator, ServiceIdentifier} from "../../commons/dependencyInjection/instantiation";
import {IRequsetHandler} from "../../commons/Mediator/IRequestHandler";
import {IMainWindowService, IWindowService} from "../../service/windowService";
import { IDeviceManager } from "../../domains/ideviceManager";
import {IDeviceContext} from "../../domains/ideviceContext";

export const ILoadDataRequestHandler = createDecorator<IRequsetHandler<IRequset>>("LoadDataRequestHandler");

export class LoadDataRequest implements IRequset{
    serviceKey: ServiceIdentifier<IRequsetHandler<IRequset>> = ILoadDataRequestHandler;

}
export class LoadDataRequestHandler implements IRequsetHandler<LoadDataRequest>{
    constructor(@IDeviceContext private deviceRepo:IDeviceContext,@IMainWindowService private windowService:IWindowService, @IDeviceManager private deviceManager:IDeviceManager) {
    }
    handle(command: LoadDataRequest): Promise<void> {
        return this.deviceRepo.getAllDevice().then((devices)=>{
            this.windowService.sendMessage({type:"CALL_BACK_INIT_DATA",data:devices.map(device => ({...device, state: this.deviceManager.deviceClients.some(client => client.address === device.address && client.state)}))})
        })
    }
}


