import { Module } from "@nestjs/common";
import { SensorsController } from "./sensors.controller";
import { SensorsService } from "./sensors.service";
import { TokensModule } from "../tokens/tokens.module";
import { AuthModule } from "../auth/auth.module";
import { PrismaPostgresModule } from "src/prisma/prismaPostgres.module";

@Module({
    imports: [PrismaPostgresModule,AuthModule,TokensModule],
    controllers: [SensorsController],
    providers: [SensorsService],
})
export class SensorsModule {}