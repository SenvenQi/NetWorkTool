import {app, BrowserWindow, ipcMain,Menu,MenuItemConstructorOptions, IpcMainInvokeEvent, protocol, globalShortcut, MenuItem} from "electron";
import { IWindowService} from "./service/windowService";
import {_util, ServicesAccessor} from "./commons/dependencyInjection/instantiation";

export class MainStartup {
    constructor(private windowService:IWindowService,private accessor:ServicesAccessor) {
        const subMenuEdit:any = [{
            label: 'Edit',
            submenu: [
                { label: 'Undo', accelerator: 'Command+Z', selector: 'undo:' },
                { label: 'Redo', accelerator: 'Shift+Command+Z', selector: 'redo:' },
                { type: 'separator' },
                { label: 'Cut', accelerator: 'Command+X', selector: 'cut:' },
                { label: 'Copy', accelerator: 'Command+C', selector: 'copy:' },
                { label: 'Paste', accelerator: 'Command+V', selector: 'paste:' },
                {
                    label: 'Select All',
                    accelerator: 'Command+A',
                    selector: 'selectAll:'
                }
            ]
        }];
        Menu.setApplicationMenu(Menu.buildFromTemplate(subMenuEdit));
        process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'
        protocol.registerSchemesAsPrivileged([{
            scheme: 'http',
            privileges: {
                secure: true,
                bypassCSP: true,
                supportFetchAPI: true,
                corsEnabled: true
            }
        }]);
        app.on("ready", () => {
            windowService.createWindow();
            app.on("activate", () => {
                if (BrowserWindow.getAllWindows().length === 0) windowService.createWindow();
            });
        });
        app.on('window-all-closed', () => {
            if (process.platform !== 'darwin') {
                app.quit()
            }
        })

        ipcMain.handle("device", (event: IpcMainInvokeEvent, path:string, data:any)=>{
            let paths = path.split("/");

            let controllerName = paths[0];
            let actionName = paths[1];

            let controller =  accessor.get(_util.serviceIds.get(controllerName))
            controller[actionName](data);
        })

    }
}
