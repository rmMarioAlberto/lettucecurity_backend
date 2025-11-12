import { Module } from "@nestjs/common";
import { IotController } from "./iot.controller";
import { IotService } from "./iot.service";
import { AuthModule } from "../auth/auth.module";
import { TokensModule } from "../tokens/tokens.module";
import { PrismaPostgresModule } from "../prisma/prismaPostgres.module";
import { TokensIotService } from "../tokens/tokensIot.service";

@Module({
    controllers : [IotController],
    providers : [IotService,TokensIotService],
    imports : [PrismaPostgresModule,AuthModule,TokensModule],
    exports : [TokensIotService]
})
export class IotModule {}