import {Device} from "../entities/device";
import {DbDevice} from "../dbDevice";
import {IDeviceContext} from "../../domains/ideviceContext";
import {IDatabaseManager} from "./DatabaseManager";
import {Command} from "../entities/command";

export class DeviceRepo implements IDeviceContext {
    private databaseManager: IDatabaseManager;

    constructor(@IDatabaseManager databaseManager: IDatabaseManager) {
        this.databaseManager = databaseManager;
    }

    public async addCommand(name: string, command: string): Promise<Command> {
        await this.databaseManager.ready;
        return await this.databaseManager.dataSource.manager.save(new Command(name, command));
    }

    public async addDevice(name: string, address: string, option: string, type: number, channelType: number) {
        await this.databaseManager.ready;
        return this.databaseManager.dataSource.transaction(async manager => {
            if (await manager.findOneBy(Device, { address })) throw new Error("不可添加同地址设备");
            return manager.save(new Device(name, address, option || "{}", type, channelType));
        });
    }

    public async removeDevice(address: string) {
        await this.databaseManager.ready;
        const deviceRepository = this.databaseManager.dataSource.getRepository(Device)
        const device = await deviceRepository.findOneBy({address: address})
        if (device) return deviceRepository.remove(device);
    }

    public async getDevice(address: string) {
        await this.databaseManager.ready;
        return await this.databaseManager.dataSource.getRepository(Device).findOneBy({address: address})
    }

    public async getAllDevice() {
        await this.databaseManager.ready;
        return await this.databaseManager.dataSource.getRepository(Device).find()
    }

    public async updateDevice(device: DbDevice) {
        await this.databaseManager.ready;
        const deviceRepository = this.databaseManager.dataSource.getRepository(Device)
        const result = await deviceRepository.findOneBy({address: device.address})
        if (!result) throw new Error("Device not found");
        result.address = device.address
        result.channelType = device.channelType
        return await deviceRepository.save(result);
    }

    public async loadCommand() {
        await this.databaseManager.ready;
        const commandRepository = this.databaseManager.dataSource.getRepository(Command)
        return await commandRepository.find();
    }
}
