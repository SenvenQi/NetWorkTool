import {guid} from "../extention/guid";
import {Column, Entity, PrimaryColumn} from "typeorm";

@Entity()
export class Command {
    @PrimaryColumn()
    id:string;

    @Column()
    name:string;

    @Column()
    hexString: string;

    constructor(name:string,command:string) {
        this.id = guid();
        this.name = name;
        this.hexString = command;
    }
}
