import { Module } from "@nestjs/common";
import { PrismaPostgresModule } from "../prisma/prismaPostgres.module";
import { TokensService } from "./tokens.service";
import { TokensIotService } from "./tokensIot.service";

@Module ({
    imports: [PrismaPostgresModule], 
    providers: [TokensService,TokensIotService],
    exports: [TokensService,TokensIotService]
})
export class TokensModule {}