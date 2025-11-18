import { Injectable } from "@nestjs/common";
import { PrismaServicePostgres } from "../prisma/prismaPosgres.service";
import { GetStageCultivoDto } from "./dto/cultivo.dto";
import { PrismaServiceMongo } from "src/prisma/prismaMongo.service";

@Injectable()
export class CultivoService {
    constructor (
        private readonly prismaPostgres : PrismaServicePostgres,
        private readonly prismaMongo : PrismaServiceMongo
    ){}

    async getCultivos (){
        const cultivos = this.prismaPostgres.cultivo.findMany({where : {status : 1}})
        return cultivos
    }

    async getCultivo (idCultivo : number) {
        const cultivo = await this.prismaPostgres.cultivo.findUnique({where: {id_cultivo:idCultivo}})
        return cultivo;
    }

    async getStagesCultivos (dto : GetStageCultivoDto) {
        const {idCultivo} = dto
        const stages = await this.prismaMongo.growth_stages.findFirst({where : {cultivo_id : idCultivo}})

        return stages;
    }

}