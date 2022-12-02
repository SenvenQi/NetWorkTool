import {IFilter, IRecivePackage} from "../../domains/irecivePackage";
import {Buffer} from "buffer";
import RecivePackage from "./recivePackage";

export default class BaseFilter implements IFilter<IRecivePackage>{
    public filter(data:Buffer): IRecivePackage {
        return new RecivePackage(data);
    }
}
