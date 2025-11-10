import { Module } from "@nestjs/common";
import { IotController } from "./iot.controller";
import { IotService } from "./iot.service";
import { AuthModule } from "src/auth/auth.module";
import { TokensModule } from "src/tokens/tokens.module";
import { PrismaPostgresModule } from "src/prisma/prismaPostgres.module";
import { TokensIotService } from "../tokens/tokensIot.service";

@Module({
    controllers : [IotController],
    providers : [IotService,TokensIotService],
    imports : [PrismaPostgresModule,AuthModule,TokensModule],
    exports : [TokensIotService]
})
export class IotModule {}