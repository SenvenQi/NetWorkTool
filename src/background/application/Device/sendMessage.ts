import { IRequsetHandler } from "../../commons/Mediator/irequestHandler";
import { createDecorator, ServiceIdentifier } from "../../commons/dependencyInjection/instantiation";
import { IRequset } from "../../commons/Mediator/irequest";
import { IDeviceManager } from "../../domains/ideviceManager";
import {IDeviceContext} from "../../domains/ideviceContext";

export const ISendMessageRequestHandler = createDecorator<IRequsetHandler<IRequset>>("SendMessageRequestRequestHandler");

export class SendMessageRequest implements IRequset {
    serviceKey: ServiceIdentifier<IRequsetHandler<IRequset>> = ISendMessageRequestHandler;
    address: string
    command: Buffer
    constructor(_address: string, _command: Buffer) {
        this.address = _address
        this.command = _command
    }
}

export class SendMessageRequestHandler implements IRequsetHandler<SendMessageRequest>{
    constructor(@IDeviceContext private deviceRepo:IDeviceContext,
        @IDeviceManager private deviceManager: IDeviceManager) {
    }
    handle(command: SendMessageRequest): void {
        this.deviceRepo.getDevice(command.address).then((device) => {
            if (!device) return
            this.deviceManager.sendMessageByAddress(command.address, command.command)
        }).catch((error)=>{
            console.log(error)
        })
    }
}
