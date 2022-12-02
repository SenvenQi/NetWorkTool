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
        return await this.databaseManager.dataSource.manager.save(new Command(name, command));
    }

    public async addDevice(name: string, address: string, option: string, type: number, channelType: number) {
        return await this.databaseManager.dataSource.manager.save(new Device(name, address, option, type, channelType));
    }

    public async removeDevice(address: string) {
        const deviceRepository = this.databaseManager.dataSource.getRepository(Device)
        const device = await deviceRepository.findOneBy({address: address})
        return await deviceRepository.remove(device)
    }

    public async getDevice(address: string) {
        return await this.databaseManager.dataSource.getRepository(Device).findOneBy({address: address})
    }

    public async getAllDevice() {
        return await this.databaseManager.dataSource.getRepository(Device).find()
    }

    public async updateDevice(device: DbDevice) {
        const deviceRepository = this.databaseManager.dataSource.getRepository(Device)
        const result = await deviceRepository.findOneBy({address: device.address})
        result.address = device.address
        result.channelType = device.channelType
        return await deviceRepository.save(result);
    }

    public async loadCommand() {
        const commandRepository = this.databaseManager.dataSource.getRepository(Command)
        return await commandRepository.find();
    }
}
