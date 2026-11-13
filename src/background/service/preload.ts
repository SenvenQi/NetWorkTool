import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
contextBridge.exposeInMainWorld("api", {
    send: (path: string, data: any): Promise<any> => ipcRenderer.invoke("device", path, data),
    receive: (channel: string, func: (params: any) => void) => {
        if (channel !== "PackageMessage") throw new Error("Unsupported event channel");
        const listener = (_event: IpcRendererEvent, data: any) => func(data);
        ipcRenderer.on(channel, listener);
        return () => ipcRenderer.removeListener(channel, listener);
    }
});
