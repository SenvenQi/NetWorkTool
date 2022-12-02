import {IRequsetHandler} from "../../commons/Mediator/irequestHandler";
import {createDecorator, ServiceIdentifier} from "../../commons/dependencyInjection/instantiation";
import {IRequset} from "../../commons/Mediator/irequest";
import {IMainWindowService, IWindowService} from "../../service/windowService";
import {IDeviceContext} from "../../domains/ideviceContext";

export const IAddCommandRequestHandler = createDecorator<IRequsetHandler<IRequset>>("AddCommandRequestHandler");

export class AddCommandRequest implements IRequset {
    serviceKey: ServiceIdentifier<IRequsetHandler<IRequset>> = IAddCommandRequestHandler;
    readonly name: string;
    readonly command: string;

    constructor(name: string, command: string) {
        this.name = name;
        this.command = command;
    }
}

export class AddCommandRequestHandler implements IRequsetHandler<AddCommandRequest> {
    constructor(@IMainWindowService private windowService: IWindowService,
                @IDeviceContext private deviceRepo: IDeviceContext) {
    }

    handle(command: AddCommandRequest): void {
        this.deviceRepo.addCommand(command.name, command.command).then((commandData) => {
            this.windowService.sendMessage({
                type: "CALL_BACK_ADD_COMMAND", data: {
                    id: commandData.id,
                    name: commandData.name,
                    hexString: Buffer.from(commandData.hexString, 'hex')
                }
            })
        }).catch((error) => {
            console.log(error)
        });
    }
}

