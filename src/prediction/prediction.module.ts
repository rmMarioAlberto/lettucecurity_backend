import { Module } from '@nestjs/common';
import { PredictionService } from './prediction.service';
import { PredictionController } from './prediction.controller';
import { PrismaServiceMongo } from '../prisma/prismaMongo.service';
import { AuthModule } from 'src/auth/auth.module';
import { TokensModule } from 'src/tokens/tokens.module';

@Module({
  imports: [AuthModule, TokensModule],
  providers: [PredictionService, PrismaServiceMongo],
  controllers: [PredictionController],
  exports: [PredictionService],
})
export class PredictionModule {}
