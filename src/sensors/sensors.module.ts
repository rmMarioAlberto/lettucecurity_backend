import { Module } from "@nestjs/common";
import { SensorsController } from "./sensors.controller";
import { SensorsService } from "./sensors.service";
import { PrismaMongoModule } from "src/prisma/prismaMongo.module";
import { TokensModule } from "src/tokens/tokens.module";
import { AuthModule } from "src/auth/auth.module";

@Module({
    imports: [PrismaMongoModule,AuthModule,TokensModule],
    controllers: [SensorsController],
    providers: [SensorsService],
})
export class SensorsModule {}