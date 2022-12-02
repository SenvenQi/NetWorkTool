import { IRequset } from "./irequest";

export interface IRequsetHandler<T extends IRequset>{
    handle(command:T):void
}