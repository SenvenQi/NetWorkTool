import {IFilter, IRecivePackage} from "../../domains/irecivePackage";
import ReceivePackage from "./recivePackage";


export default class HttpFilter implements IFilter<IRecivePackage>{

    public filter(data:any): IRecivePackage {
        return new ReceivePackage(data.toString());
    }
}
