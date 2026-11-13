import { IRequset } from "./IRequest";

export interface IRequsetHandler<T extends IRequset>{
    handle(command:T):void | Promise<void>
}