import { Module } from "@nestjs/common";
import { usersService } from "./users.service";
import { usersController } from "./users.controller";
import { PrismaPostgresModule } from "../prisma/prismaPostgres.module";
import { AuthModule } from "../auth/auth.module";
import { TokensModule } from "../tokens/tokens.module";

@Module({
    controllers: [usersController],
    providers: [usersService],
    imports: [PrismaPostgresModule,AuthModule,TokensModule]
})
export class UserModule {}