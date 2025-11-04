import { Module } from "@nestjs/common";
import { ParcelaController } from "./parcela.controller";
import { ParcelaService } from "./parcela.service";
import { PrismaPostgresModule } from "src/prisma/prismaPostgres.module";
import { AuthModule } from "src/auth/auth.module";
import { TokensModule } from "src/tokens/tokens.module";

@Module({
    controllers : [ParcelaController],
    providers : [ParcelaService],
    imports : [PrismaPostgresModule,AuthModule,TokensModule]
})
export class ParcelaModule {}