import { Module } from '@nestjs/common';
import { PrismaPostgresModule } from '../prisma/prismaPostgres.module';
import { AccessController } from './access.controller';
import { AccessService } from './access.service';
import { TokensModule } from '../tokens/tokens.module';
import { JwtModule } from '@nestjs/jwt';
@Module({
  imports: [
    PrismaPostgresModule,
    TokensModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_ACCESS_TOKEN_CLAVE,
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  controllers: [AccessController],
  providers: [AccessService],
  exports: [AccessService],
})
export class AccessModule {}
