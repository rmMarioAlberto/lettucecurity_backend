import { Module } from "@nestjs/common";
import { ParcelaController } from "./parcela.controller";
import { ParcelaService } from "./parcela.service";
import { PrismaPostgresModule } from "../prisma/prismaPostgres.module";
import { AuthModule } from "../auth/auth.module";
import { TokensModule } from "../tokens/tokens.module";
import { PrismaMongoModule } from "src/prisma/prismaMongo.module";
import { AuthUtilsService } from "../utils/getUser.service";

@Module({
    controllers : [ParcelaController],
    providers : [ParcelaService,AuthUtilsService],
    imports : [PrismaPostgresModule,PrismaMongoModule,AuthModule,TokensModule,]
})
export class ParcelaModule {}