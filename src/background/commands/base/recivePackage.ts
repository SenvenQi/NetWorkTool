import {IRecivePackage} from "../../domains/irecivePackage";
import {Buffer} from "buffer";
export default class RecivePackage implements IRecivePackage{
	/**
	 *
	 */
	constructor(message:Buffer) {
		this.message = message;
	}

	message:Buffer;
}
