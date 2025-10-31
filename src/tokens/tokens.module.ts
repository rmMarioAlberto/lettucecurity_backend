import { Module } from "@nestjs/common";
import { PrismaPostgresModule } from "../prisma/prismaPostgres.module";
import { TokensService } from "./tokens.service";

@Module ({
    imports: [PrismaPostgresModule], 
    providers: [TokensService],
    exports: [TokensService]
})
export class TokensModule {}