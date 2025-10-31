import { Module } from "@nestjs/common";
import { PrismaServicePostgres } from "./prismaPosgres.service";

@Module({
    providers: [PrismaServicePostgres],
    exports: [PrismaServicePostgres]
})
export class PrismaPostgresModule {}