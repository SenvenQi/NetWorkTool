import { ServiceIdentifier } from "../dependencyInjection/instantiation";
import { IRequsetHandler } from "./irequestHandler";

export interface IRequset{
    serviceKey:ServiceIdentifier<IRequsetHandler<IRequset>>;
}
