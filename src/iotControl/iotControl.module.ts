import { Module } from "@nestjs/common";
import { IotControlController } from "./iotControl.controller";
import { IotControlService } from "./iotControl.service";
import { PrismaPostgresModule } from "../prisma/prismaPostgres.module";
import { PrismaMongoModule } from "../prisma/prismaMongo.module";
import { CloudinaryModule } from "../cloudinary/cloudinary.module";
import { TokensModule } from "../tokens/tokens.module";
import { AuthModule } from "../auth/auth.module";

@Module({
    controllers : [IotControlController],
    providers : [IotControlService],
    imports : [PrismaPostgresModule,PrismaMongoModule,CloudinaryModule,AuthModule,TokensModule]
})
export class IotControlModule {}