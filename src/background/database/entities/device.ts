import {guid} from "../extention/guid";
import {Column, Entity, PrimaryColumn} from "typeorm";

@Entity()
export class Device {

    @PrimaryColumn()
    id: string;

    @Column()
    address: string;

    @Column()
    name: string;

    @Column()
    option: string;

    @Column("int")
    type: number;

    @Column("int")
    channelType: number;

    constructor(name: string, address: string, option: string, type: number, channelType: number) {
        this.id = guid()
        this.name = name
        this.address = address
        this.option = option
        this.type = type
        this.channelType = channelType
    }
}
