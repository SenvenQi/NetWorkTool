import { app, BrowserWindow } from "electron";
import path from "path";
import { createDecorator } from "../commons/dependencyInjection/instantiation";
export interface ResultMessage { type: string; data: any; }
export const IMainWindowService = createDecorator<IWindowService>("windowService");
export interface IWindowService {
    mainWindow: BrowserWindow;
    min(): void;
    max(): void;
    sendMessage(data: ResultMessage): void;
    createWindow(): void;
}
export class WindowService implements IWindowService {
    mainWindow: BrowserWindow;
    min() { this.mainWindow?.minimize(); }
    max() { this.mainWindow?.setFullScreen(!this.mainWindow.isFullScreen()); }
    sendMessage(data: ResultMessage) {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send("PackageMessage", data);
        }
    }
    createWindow() {
        this.mainWindow = new BrowserWindow({
            height: 600, width: 800, minWidth: 800, minHeight: 600, frame: false,
            webPreferences: {
                webSecurity: true, nodeIntegration: false, contextIsolation: true,
                preload: path.join(__dirname, "preload.js"),
            },
        });
        this.mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
        this.mainWindow.webContents.on("will-navigate", event => event.preventDefault());
        const loading = !app.isPackaged && process.env.NODE_ENV === "development"
            ? this.mainWindow.loadURL("http://localhost:3000/")
            : this.mainWindow.loadFile(app.isPackaged
                ? path.join(__dirname, "out/index.html")
                : path.join(__dirname, "../../frontend/tool/build/index.html"));
        loading.catch(error => console.error("Failed to load application", error));
    }
}
