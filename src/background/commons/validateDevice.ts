import { DeviceChannelType } from "../domains/deviceChannelType";
import { DeviceType } from "../domains/deviceType";
import { parseEndpoint, parsePort } from "./endpoint";
export function validateDevice(input: any) {
    if (!input || typeof input.name !== "string" || !input.name.trim() ||
        typeof input.address !== "string" || !input.address.trim()) throw new Error("设备名称和地址不能为空");
    const channel = Number(input.deviceChannelType);
    const type = Number(input.deviceType);
    if (!Number.isInteger(channel) || channel < 0 || channel > 4 ||
        ![DeviceType.base, DeviceType.voice].includes(type)) throw new Error("无效的设备类型");
    const address = input.address.trim();
    if (channel === DeviceChannelType.Socket) parseEndpoint(address);
    if (channel === DeviceChannelType.HttpServer || channel === DeviceChannelType.UdpDevice) parsePort(address);
    if (channel === DeviceChannelType.Serialport && (!input.option ||
        !Number.isInteger(input.option.baudRate) || input.option.baudRate <= 0)) throw new Error("无效的波特率");
    if (channel === DeviceChannelType.UdpDevice && input.option?.remotePort !== undefined) {
        parsePort(String(input.option.remotePort));
        if (typeof input.option.remoteAddress !== "string" || !input.option.remoteAddress.trim()) throw new Error("UDP 目标地址不能为空");
    }
    return {...input, name: input.name.trim(), address, deviceType: type, deviceChannelType: channel};
}
