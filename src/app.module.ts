import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { SensorsModule } from './sensors/sensors.module';
import { UserModule } from './users/users.module';
import { AccessModule } from './access/access.module';
import { IotModule } from './iot/iot.module';
import { ParcelaModule } from './parcela/parcela.module';
import { ModuleCultivo } from './cultivo/cultivo.module';
import { IotControlModule } from './iotControl/iotControl.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { CryptoModule } from './crypto/crypto.module';
import { CorsMiddleware } from './utils/cors.middleware';
// import { RateLimitMiddleware } from './utils/rate-limit.middleware';

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
    CryptoModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // ============================================
    // MIDDLEWARES GLOBALES (DESHABILITADOS)
    // ============================================
    // Para habilitar, descomenta las líneas siguientes:
    // 1. CORS MIDDLEWARE
    consumer.apply(CorsMiddleware).forRoutes('*');
    // 2. RATE LIMIT MIDDLEWARE
    // Limita el número de peticiones por IP
    // consumer.apply(RateLimitMiddleware).forRoutes('*');
    // 3. APLICAR AMBOS MIDDLEWARES
    // consumer
    //   .apply(CorsMiddleware, RateLimitMiddleware)
    //   .forRoutes('*');
  }
}
