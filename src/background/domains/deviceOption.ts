import { DeviceChannelType } from "./deviceChannelType";
import {DeviceType} from "./deviceType";

export default interface IDeviceOption{
    deviceType:DeviceType;
    deviceChannelType:DeviceChannelType;
    address:string;
    options:any;
}