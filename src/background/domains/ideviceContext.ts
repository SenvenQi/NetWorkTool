import {createDecorator} from "../commons/dependencyInjection/instantiation";
import {Device} from "../database/entities/device";
import {Command} from "../database/entities/command";

export const IDeviceContext = createDecorator<IDeviceContext>('deviceContext');
export interface IDeviceContext{
    addDevice(name: string, adrress: string, option:string, type: number, channelType: number):Promise<Device>;
    removeDevice(address:string):Promise<Device>;
    getDevice(address: string):Promise<Device>;
    getAllDevice():Promise<Device[]>;
    updateDevice(device:any):Promise<Device>;
    loadCommand():Promise<Command[]>;
    addCommand(name:string,command:string):Promise<Command>;
}
