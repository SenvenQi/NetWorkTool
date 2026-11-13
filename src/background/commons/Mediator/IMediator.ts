import { IDeviceManager } from "../../domains/ideviceManager";
import {createDecorator, ServicesAccessor} from "../dependencyInjection/instantiation";
import { IRequset } from "./IRequest";

export const IMediator = createDecorator<IMediator>("mediator")


export interface IMediator{
   send(request:IRequset):void | Promise<void>
}

export class Mediator implements IMediator{
    private accessor:ServicesAccessor;

    constructor(_accessor:ServicesAccessor){
        this.accessor=_accessor
    }

    send(request: IRequset): void | Promise<void> {
        const result = this.accessor.get(request.serviceKey);
        return result.handle(request)
    }

 }

