import { Module } from "@nestjs/common";
import { PrismaServiceMongo } from "./prismaMongo.service";

@Module({
    providers: [PrismaServiceMongo],
    exports: [PrismaServiceMongo]
})
export class PrismaMongoModule {}