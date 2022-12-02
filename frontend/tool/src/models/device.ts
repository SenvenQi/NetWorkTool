import { DeviceType } from "./deviceType";
import { DeviceChannelType } from "./deviceChannelType";

export default interface IDevice{
    name:string;
    address:string;
    deviceType:DeviceType;
    deviceChannelType:DeviceChannelType;
    selected:boolean;
    options?:any;
    state:boolean;
}