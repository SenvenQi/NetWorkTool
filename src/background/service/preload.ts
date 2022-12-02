import {
    contextBridge,
    ipcRenderer
} from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
    "api", {
        send: (path:string, data:any):Promise<any> => {
           return ipcRenderer.invoke("device", path, data);
        },
        receive: (channel:string, func:(params:any[]) =>void) => {
            ipcRenderer.on(channel, (event, args:any[]) => func(args));
        }
    }
);
