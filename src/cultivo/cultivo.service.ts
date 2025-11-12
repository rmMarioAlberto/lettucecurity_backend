import { Injectable } from "@nestjs/common";
import { PrismaServicePostgres } from "../prisma/prismaPosgres.service";

@Injectable()
export class CultivoService {
    constructor (
        private prismaPostgres : PrismaServicePostgres
    ){}

    async getCultivos (){
        const cultivos = this.prismaPostgres.cultivo.findMany({where : {status : 1}})
        return cultivos
    }

    async getCultivo (idCultivo : number) {
        const cultivo = await this.prismaPostgres.cultivo.findUnique({where: {id_cultivo:idCultivo}})
        return cultivo;
    }

}