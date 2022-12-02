import {IDisposable} from "../commons/idisposable";

export default interface IDevice extends IDisposable{
    address:string;
    state:boolean;
    sendMessage:(command:Uint8Array)=>void;
}
