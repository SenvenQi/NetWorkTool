import { app, dialog } from 'electron'
import { readFile, stat } from 'fs/promises';
import path from 'path';
import { IDeviceManager } from '../domains/ideviceManager';
import { IDeviceContext } from '../domains/ideviceContext';
import SshDeviceClient, { inspectSshHost } from '../deviceManager/sshDeviceClient';
import { remotePath } from '../commons/sshOptions';
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
        @IMainWindowService private readonly windowService: IWindowService,
        @IDeviceManager private readonly deviceManager: IDeviceManager,
        @IDeviceContext private readonly deviceRepo: IDeviceContext) {
    }

    private remote(address: string) {
        const device = this.deviceManager.deviceClients.find(client => client.address === address);
        if (!(device instanceof SshDeviceClient)) throw new Error("SSH/SFTP 未连接");
        return device;
    }

    async inspectSshHost(address: string) {
        const device = await this.deviceRepo.getDevice(address);
        if (!device || ![5, 6].includes(device.channelType)) throw new Error("无效的 SSH/SFTP 配置");
        return {fingerprint: await inspectSshHost(address, device.channelType === 5 ? "ssh" : "sftp"),
            username: JSON.parse(device.option || "{}").username || ""};
    }

    async chooseSshKey() {
        const result = await dialog.showOpenDialog(this.windowService.mainWindow, {title: "选择 SSH 私钥", properties: ["openFile"]});
        if (result.canceled || !result.filePaths[0]) return null;
        const info = await stat(result.filePaths[0]);
        if (!info.isFile() || info.size > 1024 * 1024) throw new Error("私钥文件不能超过 1 MiB");
        return {name: path.basename(result.filePaths[0]), content: await readFile(result.filePaths[0], "utf8")};
    }

    async connectRemote(data: any) {
        const device = await this.deviceRepo.getDevice(data?.address);
        if (!device || ![5, 6].includes(device.channelType)) throw new Error("无效的 SSH/SFTP 配置");
        return this.mediator.send(new ConnectDeviceRequest(data));
    }

    remoteSnapshot(address: string) {
        const device = this.deviceManager.deviceClients.find(client => client.address === address);
        return device instanceof SshDeviceClient ? device.snapshot() : {sessionId: "", sequence: 0, bytes: Buffer.alloc(0), state: false};
    }

    remoteWrite(data: any) {
        if (typeof data?.text !== "string") throw new Error("无效的终端输入");
        return this.remote(data.address).sendMessage(Buffer.from(data.text, "utf8"));
    }

    remoteResize(data: any) { this.remote(data.address).resize(data.cols, data.rows); }

    async sftpAction(data: any) {
        const device = this.remote(data.address);
        switch (data.action) {
            case "list": return device.list(data.path);
            case "mkdir": return device.mkdir(data.path);
            case "rename": return device.rename(data.path, data.destination);
            case "remove": return device.remove(data.path);
            default: throw new Error("不支持的 SFTP 操作");
        }
    }

    async sftpTransfer(data: any) {
        const device = this.remote(data.address);
        remotePath(data.path);
        if (data.direction === "upload") {
            const selection = await dialog.showOpenDialog(this.windowService.mainWindow, {title: "选择上传文件", properties: ["openFile"]});
            if (selection.canceled || !selection.filePaths[0]) return null;
            const local = selection.filePaths[0];
            return device.transferFile("upload", local, path.posix.join(data.path, path.basename(local)));
        }
        if (data.direction === "download") {
            const selection = await dialog.showSaveDialog(this.windowService.mainWindow, {title: "保存下载文件", properties: ["showOverwriteConfirmation", "createDirectory"], defaultPath: path.posix.basename(data.path).replace(/[<>:"\\|?*]/g, "_")});
            if (selection.canceled || !selection.filePath) return null;
            return device.transferFile("download", selection.filePath, data.path);
        }
        throw new Error("不支持的传输方向");
    }

    cancelSftpTransfer(address: string) { this.remote(address).cancelTransfer(); }

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
