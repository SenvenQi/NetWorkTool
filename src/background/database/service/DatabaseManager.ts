import {Device} from "../entities/device";
import {createDecorator} from "../../commons/dependencyInjection/instantiation";
import {DataSource} from "typeorm";
import {Command} from "../entities/command";
import path from "path";
import {app} from "electron";

export const IDatabaseManager = createDecorator<IDatabaseManager>('databaseManager');
export interface IDatabaseManager {
    dataSource:DataSource
}

export class DatabaseManager implements IDatabaseManager{
    dataSource:DataSource

    constructor() {
        this.dataSource = new DataSource({
            type: "sqlite",
            database: path.join(app.getPath("userData"),"desktopApp.db"),
            entities: [Device,Command],
            synchronize: true,
            logging: false,
        })
       // this.dataSource.initialize()
        this.InitORM()
    }

    private async InitORM() {
        // await createConnection(this.dataSourceOptions).then(async connection => {
        //     const posts = await connection.getRepository("Post").find();
        //     console.log("posts:", posts);
        // });
        await this.dataSource.initialize();
        //await this.initTableData()
    }
}
