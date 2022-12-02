import {Buffer} from "buffer";

export default class SendPackage{

    private readonly message:string;

    constructor(message:string) {
        this.message = message;
    }

    static Create(message:string){
        return new SendPackage(message);
    }

    getCmd(){
        return Buffer.from(this.message, 'hex');
    }
}


