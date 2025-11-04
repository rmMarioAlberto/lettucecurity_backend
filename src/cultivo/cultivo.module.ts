import { Module } from "@nestjs/common";
import { CultivoController } from "./cultivo.controller";
import { CultivoService } from "./cultivo.service";
import { PrismaPostgresModule } from "src/prisma/prismaPostgres.module";
import { AuthModule } from "src/auth/auth.module";
import { TokensModule } from "src/tokens/tokens.module";

@Module({
    controllers : [CultivoController],
    providers : [CultivoService],
    imports : [PrismaPostgresModule,AuthModule,TokensModule]
})
export class ModuleCultivo {}