import { app, BrowserWindow, ipcMain, Menu } from "electron";
import { IWindowService } from "./service/windowService";
import { ServicesAccessor } from "./commons/dependencyInjection/instantiation";
import { IDeviceController } from "./controllers/deviceController";
import { IDatabaseManager } from "./database/service/DatabaseManager";
import { IDeviceManager } from "./domains/ideviceManager";
import { getDeviceAction } from "./service/ipcRoutes";
export class MainStartup {
    constructor(windowService: IWindowService, accessor: ServicesAccessor) {
        Menu.setApplicationMenu(Menu.buildFromTemplate([{ role: "editMenu" }]));
        ipcMain.handle("device", async (event, route: unknown, data: any) => {
            if (event.sender !== windowService.mainWindow?.webContents || event.senderFrame !== event.sender.mainFrame) {
                throw new Error("Untrusted IPC sender");
            }
            const action = getDeviceAction(route);
            await accessor.get(IDatabaseManager).ready;
            const controller = accessor.get(IDeviceController);
            return (controller as any)[action](data);
        });
        app.whenReady().then(async () => {
            await accessor.get(IDatabaseManager).ready;
            windowService.createWindow();
            app.on("activate", () => {
                if (BrowserWindow.getAllWindows().length === 0) windowService.createWindow();
            });
        }).catch(error => { console.error("Application startup failed", error); app.quit(); });
        app.on("window-all-closed", () => {
            const manager = accessor.get(IDeviceManager);
            for (const device of [...manager.deviceClients]) manager.removeDeviceClient(device.address);
            if (process.platform !== "darwin") app.quit();
        });
    }
}
