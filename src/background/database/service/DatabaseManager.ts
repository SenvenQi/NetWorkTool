import { Device } from "../entities/device";
import { createDecorator } from "../../commons/dependencyInjection/instantiation";
import { DataSource } from "typeorm";
import { Command } from "../entities/command";
import path from "path";
import { mkdir } from "fs/promises";
import { app } from "electron";
export const IDatabaseManager = createDecorator<IDatabaseManager>("databaseManager");
export interface IDatabaseManager { ready: Promise<DataSource>; dataSource: DataSource; }
export class DatabaseManager implements IDatabaseManager {
    dataSource: DataSource;
    ready: Promise<DataSource>;
    constructor() {
        const directory = app.getPath("userData");
        this.dataSource = new DataSource({
            type: "better-sqlite3", database: path.join(directory, "desktopApp.db"),
            entities: [Device, Command], synchronize: true, logging: false,
        });
        this.ready = app.whenReady().then(async () => {
            await mkdir(directory, { recursive: true });
            return this.dataSource.initialize();
        });
        this.ready.catch(error => console.error("Database initialization failed", error));
    }
}
