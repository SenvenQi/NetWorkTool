import { IRequsetHandler } from "../../commons/Mediator/irequestHandler";
import { createDecorator, ServiceIdentifier } from "../../commons/dependencyInjection/instantiation";
import { IRequset } from "../../commons/Mediator/irequest";
import { IMainWindowService, IWindowService } from "../../service/windowService";
import { IDeviceContext } from "../../domains/ideviceContext";

export const ILoadCommandRequestHandler = createDecorator<IRequsetHandler<IRequset>>("LoadCommandRequestHandler");

export class LoadCommandRequest implements IRequset {
    serviceKey: ServiceIdentifier<IRequsetHandler<IRequset>> = ILoadCommandRequestHandler;
}

export class LoadCommandRequestHandler implements IRequsetHandler<LoadCommandRequest>{
    constructor( @IMainWindowService private windowService: IWindowService,
                 @IDeviceContext private deviceRepo:IDeviceContext ) {
    }
    handle(command: LoadCommandRequest): void {
        this.deviceRepo.loadCommand().then((commands)=>{
               const viewCommands = commands.map(item=>{
                    return {
                        id:item.id,
                        name:item.name,
                        hexString : Buffer.from(item.hexString, 'hex')
                    }
                })
                this.windowService.sendMessage({type:"CALL_BACK_INIT_COMMAND_DATA",data:viewCommands})
        }).catch((error)=>{
            console.log(error)
        });
    }
}

