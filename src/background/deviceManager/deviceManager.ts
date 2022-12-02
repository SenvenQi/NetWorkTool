import IDeviceOption from "../domains/deviceOption";
import DeviceSocketClient from './deviceSocketClient'
import {Buffer} from "buffer";
import {IDeviceManager} from "../domains/ideviceManager";
import DeviceSerialportClient from "./deviceSerialportClient";
import IDevice from "../domains/device";
import {DeviceChannelType} from "../domains/deviceChannelType";
import {MessageType} from "../domains/messageType";
import {IMainWindowService, IWindowService, ResultMessage} from "../service/windowService";
import DeviceHttpServer from "./deviceHttpServer";
import HidDeviceClient from "./hidDeviceClient";
import UdpDeviceClient from "./udpDeviceClient";

export default class DeviceManager implements IDeviceManager {
    public deviceClients: IDevice[];
    constructor(@IMainWindowService private windowService:IWindowService) {
        this.deviceClients = [];
    }

    sendMessage(data:ResultMessage){
        this.windowService.sendMessage(data);
    }

    addDeviceClient(deviceOptions: IDeviceOption) {
        let device = this.deviceClients.find(item => item.address === deviceOptions.address);
        if (!device) {
            let deviceClient;
            switch (deviceOptions.deviceChannelType) {
                case DeviceChannelType.HttpServer:
                    deviceClient = new DeviceHttpServer(deviceOptions,this.sendMessage.bind(this),this.removeDeviceClient.bind(this))
                    break;
                case DeviceChannelType.Serialport:
                    deviceClient = new DeviceSerialportClient(deviceOptions,this.sendMessage.bind(this),this.removeDeviceClient.bind(this))
                    break;
                case DeviceChannelType.Socket:
                    deviceClient = new DeviceSocketClient(deviceOptions,this.sendMessage.bind(this),this.removeDeviceClient.bind(this))
                    break;
                case DeviceChannelType.HidDevice:
                    deviceClient = new HidDeviceClient(deviceOptions,this.sendMessage.bind(this),this.removeDeviceClient.bind(this))
                    break;
                case DeviceChannelType.UdpDevice:
                    deviceClient = new UdpDeviceClient(deviceOptions,this.sendMessage.bind(this),this.removeDeviceClient.bind(this))
                    break;
            }
            deviceClient.connect();
            this.deviceClients.push(deviceClient);
        } else if (device.state === false) {
            (device as any).connect();
        }
    }

    sendMessageByAddress(address: string, command: Buffer) {
        const deviceClient = this.deviceClients.find(item => item.address === address);
        return deviceClient?.sendMessage(command)
    }

    removeDeviceClient(address: string): void {
        const deviceClient = this.deviceClients.find(item => item.address === address);
        if (deviceClient) {
            deviceClient.dispose();
            this.windowService.sendMessage({type:"RECIVE_MESSAGE",data:{ messageType: MessageType.ChangeState, message: { success: false, address: address, info: "连接已断开" } }})
            this.deviceClients = this.deviceClients.filter(item => item.address !== address);
        }
    }
}
