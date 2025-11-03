import { Module } from "@nestjs/common";
import { IotController } from "./iot.controller";
import { IotService } from "./iot.service";
import { PrismaMongoModule } from "src/prisma/prismaMongo.module";
import { AuthModule } from "src/auth/auth.module";
import { TokensModule } from "src/tokens/tokens.module";

@Module({
    controllers : [IotController],
    providers : [IotService],
    imports : [PrismaMongoModule,AuthModule,TokensModule]
})
export class IotModule {}