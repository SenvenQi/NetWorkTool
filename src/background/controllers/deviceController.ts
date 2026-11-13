import { app } from 'electron'
import { validateDevice } from '../commons/validateDevice';
import BaseSendPackage from "../commands/base/sendPackage";
import { SerialPort } from 'serialport';
import { IMediator } from "../commons/Mediator/IMediator";
import { AddDeviceRequest } from '../application/Device/addDevice';
import { RemoveDeviceRequest } from '../application/Device/removeDevice';
import { SendMessageRequest } from '../application/Device/sendMessage';
import { ConnectDeviceRequest } from '../application/Device/connectDevice';
import { CloseDeviceRequest } from '../application/Device/closeDevice';
import { createDecorator } from "../commons/dependencyInjection/instantiation";
import { IMainWindowService, IWindowService } from '../service/windowService';
import { LoadDataRequest } from "../application/Device/loadDataDevice";
import { devices } from "node-hid";
import {LoadCommandRequest} from "../application/Command/loadCommand";
import {ClipboardService, IClipboardService} from "../service/ClipboardService";
import { Buffer } from "buffer";
import {AddCommandRequest} from "../application/Command/addCommand";

export const IDeviceController = createDecorator<DeviceController>("device")
export class DeviceController {
    constructor(@IMediator private readonly mediator: IMediator,
        @IClipboardService private readonly clipborardService:ClipboardService,
        @IMainWindowService private readonly windowService: IWindowService) {
    }

    close() {
        app.quit();
    }
    min() {
        this.windowService.min();
    }
    max() {
        this.windowService.max()
    }

    addDevice(message: any) {
        message = validateDevice(message);
        return this.mediator.send(new AddDeviceRequest(message.name, message.address, message.option, message.deviceType, message.deviceChannelType));
    }

    addCommand(message:any){
        if (!message || typeof message.name !== "string" || !message.name.trim() || typeof message.command !== "string" || !message.command.length) throw new Error("命令名称和内容不能为空");
        if (![0, 1].includes(Number(message.type))) throw new Error("无效的命令类型");
        return this.mediator.send(new AddCommandRequest(message.name.trim(), message.type === 1 || message.type === "1"
            ? Buffer.from(message.command, "utf8").toString("hex")
            : BaseSendPackage.Create(message.command).getCmd().toString("hex")))
    }

    loadCommand() {
        return this.mediator.send(new LoadCommandRequest());
    }

    copyToClipborard(text:Buffer){
        return this.clipborardService.copy(text);
    }

    connectDevice(deivce: any) {
        return this.mediator.send(new ConnectDeviceRequest(deivce));
    }

    closeDevice(address: any) {
        return this.mediator.send(new CloseDeviceRequest(address));
    }

    removeDevice(address: any) {
        return this.mediator.send(new RemoveDeviceRequest(address))
    }

    sendMessage(message: any) {
        return this.mediator.send(new SendMessageRequest(message.address, BaseSendPackage.Create(message.message).getCmd()))
    }

    loadData(){
        return this.mediator.send(new LoadDataRequest());
    }

    getHidDevices(){
        let deviceList = devices();
        this.windowService.sendMessage({type:'SET_HID_DEVCIE',data:deviceList})
    }

    getPorts() {
         return SerialPort.list().then((ports)=>{
             this.windowService.sendMessage({type:"SET_PORTS",data:ports})
         })
    }
}
