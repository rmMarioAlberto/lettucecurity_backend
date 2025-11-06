import { Module } from "@nestjs/common";
import { IotController } from "./iot.controller";
import { IotService } from "./iot.service";
import { AuthModule } from "src/auth/auth.module";
import { TokensModule } from "src/tokens/tokens.module";
import { PrismaPostgresModule } from "src/prisma/prismaPostgres.module";

@Module({
    controllers : [IotController],
    providers : [IotService],
    imports : [PrismaPostgresModule,AuthModule,TokensModule]
})
export class IotModule {}