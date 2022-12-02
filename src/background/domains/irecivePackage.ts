import {Buffer} from "buffer";

export interface IRecivePackage
{
    message:any;
}


export interface IFilter<T extends IRecivePackage> {
    filter:(data:Buffer)=>T;
}
