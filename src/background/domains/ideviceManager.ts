import {Buffer} from "buffer";
import {createDecorator} from "../commons/dependencyInjection/instantiation";
import IDeviceOption from "./deviceOption";

export const IDeviceManager = createDecorator<IDeviceManager>('deviceManagerService');
export interface IDeviceManager {
    addDeviceClient: (deviceOptions: IDeviceOption) => void;
    removeDeviceClient: (address: string) => void;
    sendMessageByAddress: (address:string,command:Buffer) => void;
}
