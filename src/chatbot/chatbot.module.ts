import { Module } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ChatbotController } from './chatbot.controller';
import { ChatbotQueryService } from './chatbotQuery.service';
import { AuthModule } from 'src/auth/auth.module';
import { TokensModule } from 'src/tokens/tokens.module';
import { PrismaPostgresModule } from 'src/prisma/prismaPostgres.module';
import { PrismaMongoModule } from 'src/prisma/prismaMongo.module';
import { PredictionModule } from '../prediction/prediction.module';
import { AuthUtilsService } from '../utils/getUser.service';

@Module({
  imports: [
    PrismaPostgresModule,
    PrismaMongoModule,
    AuthModule,
    TokensModule,
    PredictionModule,
  ],
  controllers: [ChatbotController],
  providers: [ChatbotService, ChatbotQueryService, AuthUtilsService],
})
export class ChatbotModule {}
