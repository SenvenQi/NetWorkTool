import {IFilter, IRecivePackage} from "../../domains/irecivePackage";
import {Buffer} from "buffer";
import RecivePackage from "./recivePackage";

export default class VoiceFilter implements IFilter<IRecivePackage>{

    public filter(data:Buffer): IRecivePackage {
        return new RecivePackage();
    }
}