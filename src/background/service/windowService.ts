import { BrowserWindow } from "electron";
import path from "path";
import { createDecorator } from "../commons/dependencyInjection/instantiation";
import config from "./config.json"
export interface ResultMessage{
    type:string;
    data:any
}

export const IMainWindowService = createDecorator<IWindowService>("windowService")

export interface IWindowService{
    mainWindow: BrowserWindow;
    min():void;
    max():void;
    sendMessage(data:ResultMessage):void;
    createWindow():void;
}

export class WindowService implements IWindowService{
    mainWindow: BrowserWindow

    min() {
        this.mainWindow.minimize();
    }
    max() {
        if (this.mainWindow.isFullScreen())
            this.mainWindow.setFullScreen(false);
        else
            this.mainWindow.setFullScreen(true);
    }

    sendMessage(data:ResultMessage){
        this.mainWindow.webContents.send("PackageMessage", data);
    }

    createWindow() {
        this.mainWindow = new BrowserWindow({
            height: 600,
            webPreferences: {
                webSecurity: false,
                nodeIntegration: true,
                preload: path.join(__dirname, "preload.js"),
            },
            frame:false,
            // fullscreen:true,
            // transparent:true,
            // alwaysOnTop:true,
            // opacity:.5,
            // backgroundColor:'#ff00ff',
            width: 800,
        });
        // this.mainWindow.setIgnoreMouseEvents(true);
        // and load the index.html of the app.
        if (config.isDev !== "development"){
            this.mainWindow.loadURL(`file://${path.join(__dirname, "./out/index.html")}`);
        }
        else{
            this.mainWindow.loadURL("http://localhost:3000/")
            this.mainWindow.webContents.openDevTools();
        }
    }

}
