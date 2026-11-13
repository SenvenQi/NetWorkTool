import { IRecivePackage } from "../../domains/irecivePackage";
export default class RecivePackage implements IRecivePackage {
    constructor(public message: Buffer) {}
}
