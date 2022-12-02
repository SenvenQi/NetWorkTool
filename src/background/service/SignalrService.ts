import {HubConnection, HubConnectionBuilder} from "@microsoft/signalr";
import {MessagePackHubProtocol} from "@microsoft/signalr-protocol-msgpack";


export class SignalrService {
    private hubConnection:HubConnection;
    constructor() {
        this.setupConnection()
    }

    private setupConnection() {
        if (!this.hubConnection){
            this.hubConnection = new HubConnectionBuilder()
                .withUrl("http://101.32.205.22:8889/device",{
                    accessTokenFactory:()=>{
                        return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhcGkiLCJpc3MiOiJDYXNlQ2VudGVyIiwibmFtZWlkIjoiNzYwOWFlMDctNWQxYS00ZTc0LTkxMjQtYWYxMDM5ZGY0YjY1Iiwicm9sZSI6IuaZrumAmueuoeeQhuWRmCIsIm5iZiI6MTY2MjczODcxOCwiZXhwIjoxNjY1MzMwNzE4LCJpYXQiOjE2NjI3Mzg3MTh9.M1lIJvmxCve_hrJU0KU9oXBOooFshtZkE9d29-CeVRk";
                    }
                })
                .withHubProtocol(new MessagePackHubProtocol())
                .build();
        }
        this.hubConnection.start()
        this.hubConnection.on("",()=>{

        })
    }
}
