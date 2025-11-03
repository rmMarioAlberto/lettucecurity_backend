import { Injectable } from "@nestjs/common";
import { PrismaServiceMongo } from "src/prisma/prismaMongo.service";
import { CreateIotDto } from "./dto/iotDto.dto";

@Injectable()
export class IotService {
    
    constructor (
        private prismaMongo : PrismaServiceMongo
    ){}

    async createIot(createIotDto: CreateIotDto){
        
    }

}