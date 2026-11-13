import { ServiceIdentifier } from "../dependencyInjection/instantiation";
import { IRequsetHandler } from "./IRequestHandler";

export interface IRequset{
    serviceKey:ServiceIdentifier<IRequsetHandler<IRequset>>;
}
