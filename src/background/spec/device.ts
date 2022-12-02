import { DeviceChannelType } from "../domains/deviceChannelType";
import { DeviceType } from "../domains/deviceType";

export interface DeviceSpec {
    name: string;
    address: string;
    option: string;
    deviceType:DeviceType;
    deviceChannelType:DeviceChannelType;
}