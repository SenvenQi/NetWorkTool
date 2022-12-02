import * as http from "http";
import {IDisposable} from "./idisposable";
import formidable, {Fields, Files} from 'formidable';

export default abstract class HttpServer implements IDisposable{
    private httpServer: http.Server;
    private readonly port:number;
    protected constructor(port:number) {
        this.port = port;
    }

    protected onError(has_error:any){

    }

    abstract onConnect(data:any):void;

    abstract onData(data:any):void;

    onFormData(err: any, fields: Fields, files: Files){
        if (!err){
            this.onData(JSON.stringify({fields:fields,files:files}))
        }
    }

    protected onTimeout(){

    }

    private requestHandler(req: http.IncomingMessage, res: http.ServerResponse) {
        const form = formidable({});
        if (req.headers["content-type"]?.startsWith("multipart/form-data"))
            form.parse(req,(err: any, fields: Fields, files: Files)=>{
                if (!err){
                    this.onData(JSON.stringify({fields:fields,files:files}))
                }
            });
        else
            req.on("data",(data:any)=>{
                this.onData(data.toString())
            })
        res.writeHead(200,{'Content-type':'text/plain'});
        res.end("<strong>OK!</strong>");
    }

    private init(){
        this.httpServer = http.createServer(this.requestHandler.bind(this));
        this.httpServer.on("error", this.onError.bind(this))
        this.httpServer.on("listening", this.onConnect.bind(this))
        this.httpServer.on("timeout", this.onTimeout.bind(this))
    }

    connect() {
        this.init();
        this.httpServer.listen(this.port);
    }


    dispose(): void {
        this.httpServer.removeAllListeners();
        this.httpServer.close();
        delete this.httpServer;
    }

}
