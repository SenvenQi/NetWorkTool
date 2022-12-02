import {IRecivePackage} from "../../domains/irecivePackage";

export default class ReceivePackage implements IRecivePackage{
    /**
     *
     */
    constructor(message:string) {
        this.message = message;
    }
    message:string;
}
