import { Module } from "@nestjs/common";
import { SensorsController } from "./sensors.controller";
import { SensorsService } from "./sensors.service";
import { PrismaMongoModule } from "src/prisma/prismaMongo.module";

@Module({
    imports: [PrismaMongoModule],
    controllers: [SensorsController],
    providers: [SensorsService],
})
export class SensorsModule {}