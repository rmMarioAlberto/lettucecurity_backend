import { Module } from '@nestjs/common';
import { CronController } from './cron.controller';
import { AccessModule } from '../access/access.module';

@Module({
  imports: [AccessModule],
  controllers: [CronController],
})
export class CronModule {}
