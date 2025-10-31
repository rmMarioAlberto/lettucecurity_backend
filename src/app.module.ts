import { Module } from '@nestjs/common';
import { SensorsModule } from './sensors/sensors.module';
import { UserModule } from "./users/users.module";
import { AccessModule } from "./access/access.module";

@Module({
  imports: [
    SensorsModule,
    AccessModule,
    UserModule
  ],
})
export class AppModule {}
