import { Module } from "@nestjs/common";
import { CultivoController } from "./cultivo.controller";
import { CultivoService } from "./cultivo.service";
import { PrismaPostgresModule } from "../prisma/prismaPostgres.module";
import { AuthModule } from "../auth/auth.module";
import { TokensModule } from "../tokens/tokens.module";
import { PrismaMongoModule } from "src/prisma/prismaMongo.module";

@Module({
    controllers : [CultivoController],
    providers : [CultivoService],
    imports : [PrismaPostgresModule,PrismaMongoModule,AuthModule,TokensModule]
})
export class ModuleCultivo {}