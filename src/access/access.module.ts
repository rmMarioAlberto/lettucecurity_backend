import { Module } from "@nestjs/common";
import { PrismaServicePostgres } from "src/prisma/prismaPosgres.service";
import { AccessController } from "./access.controller";
import { AccessService } from "./access.service";
import { TokensModule } from "../tokens/tokens.module";

@Module({
    imports: [TokensModule],
    controllers: [AccessController],
    providers: [AccessService,PrismaServicePostgres],
})
export class AccessModule {}