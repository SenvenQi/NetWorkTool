import * as dgram from "dgram";
import {IDisposable} from "./idisposable";


export abstract class UdpClient implements IDisposable {
    udpClient: dgram.Socket;
    socketAddress: string

    protected constructor(address: string) {
        this.socketAddress = address;
    }


    abstract onError(error: any): void;

    abstract onOpen(): void;

    abstract onData(data: any): void;

    connect() {
        this.udpClient = dgram.createSocket("udp4");
        this.udpClient.on("listening", this.onOpen.bind(this))
        this.udpClient.on("error", this.onError.bind(this))
        this.udpClient.on("message", this.onData.bind(this))
        this.udpClient.bind(parseInt(this.socketAddress))
    }

    send(command: Uint8Array) {
        this.udpClient.send(command, 1500, "255.255.255.255", (err, bytes) => {
            console.log(err)
        });
    }

    dispose() {
        this.udpClient.close();
        delete this.udpClient;
    }
}
