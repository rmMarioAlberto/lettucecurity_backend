import { MiddlewareConsumer, Module } from '@nestjs/common';
import { SensorsModule } from './sensors/sensors.module';
import { UserModule } from "./users/users.module";
import { AccessModule } from "./access/access.module";
import { IotModule } from './iot/iot.module';
import { ParcelaModule } from './parcela/parcela.module';
import { ModuleCultivo } from './cultivo/cultivo.module';
// import { CorsMiddleware } from './utils/cors.middleware';
// import { RateLimitMiddleware } from './utils/rate-limit.middleware';
import { IotControlModule } from './iotControl/iotControl.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { CryptoModule } from './crypto/crypto.module';

@Module({
  imports: [
    SensorsModule,
    AccessModule,
    UserModule,
    IotModule,
    ParcelaModule,
    ModuleCultivo,
    IotControlModule,
    ChatbotModule,
    CryptoModule
  ],
})
export class AppModule {

  // configure(consumer: MiddlewareConsumer) {
  //   consumer
  //     .apply(CorsMiddleware, RateLimitMiddleware)
  //     .forRoutes('*'); 
  // }

}
