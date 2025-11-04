import { Module } from '@nestjs/common';
import { SensorsModule } from './sensors/sensors.module';
import { UserModule } from "./users/users.module";
import { AccessModule } from "./access/access.module";
import { IotModule } from './iot/iot.module';
import { ParcelaModule } from './parcela/parcela.module';
import { ModuleCultivo } from './cultivo/cultivo.module';

@Module({
  imports: [
    SensorsModule,
    AccessModule,
    UserModule,
    IotModule,
    ParcelaModule,
    ModuleCultivo
  ],
})
export class AppModule {}
