import {IRequset} from "../../commons/Mediator/IRequest";
import {createDecorator, ServiceIdentifier} from "../../commons/dependencyInjection/instantiation";
import {IRequsetHandler} from "../../commons/Mediator/IRequestHandler";
import {IMainWindowService, IWindowService} from "../../service/windowService";
import {IDeviceContext} from "../../domains/ideviceContext";

export const ILoadDataRequestHandler = createDecorator<IRequsetHandler<IRequset>>("LoadDataRequestHandler");

export class LoadDataRequest implements IRequset{
    serviceKey: ServiceIdentifier<IRequsetHandler<IRequset>> = ILoadDataRequestHandler;

}
export class LoadDataRequestHandler implements IRequsetHandler<LoadDataRequest>{
    constructor(@IDeviceContext private deviceRepo:IDeviceContext,@IMainWindowService private windowService:IWindowService) {
    }
    handle(command: LoadDataRequest): void {
        this.deviceRepo.getAllDevice().then((devices)=>{
            this.windowService.sendMessage({type:"CALL_BACK_INIT_DATA",data:devices})
        }).catch((error)=>{
            console.log(error)
        })
    }
}


