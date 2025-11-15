import { Module } from "@nestjs/common";
import { PrismaPostgresModule } from "../prisma/prismaPostgres.module";
import { TokensService } from "./tokens.service";
import { TokensIotService } from "./tokensIot.service";
import { JwtModule } from '@nestjs/jwt'; 

@Module({
  imports: [
    PrismaPostgresModule,
    JwtModule.registerAsync({  
      useFactory: () => ({
        secret: process.env.JWT_ACCESS_TOKEN_CLAVE, 
        signOptions: { expiresIn: '15m' },  
      }),
    }),
  ],
  providers: [TokensService, TokensIotService],
  exports: [TokensService, TokensIotService, JwtModule],  
})
export class TokensModule {}