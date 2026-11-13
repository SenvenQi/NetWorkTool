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
            if (!deviceClient) throw new Error("不支持的设备通道");
            this.deviceClients.push(deviceClient);
            try { deviceClient.connect(); } catch (error) {
                this.removeDeviceClient(deviceOptions.address);
                throw error;
            }
        } else if (device.state === false) {
            this.removeDeviceClient(device.address);
            this.addDeviceClient(deviceOptions);
        }
    }

    sendMessageByAddress(address: string, command: Buffer) {
        const deviceClient = this.deviceClients.find(item => item.address === address);
        if (!deviceClient || !deviceClient.state) throw new Error("设备未连接");
        if (deviceClient.sendMessage(command) === false) throw new Error("此设备不支持发送");
    }

    removeDeviceClient(address: string): void {
        const deviceClient = this.deviceClients.find(item => item.address === address);
        if (deviceClient) {
            this.deviceClients = this.deviceClients.filter(item => item !== deviceClient);
            deviceClient.state = false;
            deviceClient.dispose();
            this.windowService.sendMessage({type:"RECIVE_MESSAGE",data:{ messageType: MessageType.ChangeState, message: { success: false, address: address, info: "连接已断开" } }})
            this.deviceClients = this.deviceClients.filter(item => item.address !== address);
        }
    }
}
