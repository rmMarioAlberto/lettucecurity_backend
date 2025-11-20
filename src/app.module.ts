import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { SensorsModule } from './sensors/sensors.module';
import { UserModule } from './users/users.module';
import { AccessModule } from './access/access.module';
import { IotModule } from './iot/iot.module';
import { ParcelaModule } from './parcela/parcela.module';
import { ModuleCultivo } from './cultivo/cultivo.module';
import { IotControlModule } from './iotControl/iotControl.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { CronModule } from './cron/cron.module';
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
    CronModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // ============================================
    // MIDDLEWARES GLOBALES (DESHABILITADOS)
    // ============================================
    // Para habilitar, descomenta las líneas siguientes:
    // 1. CORS MIDDLEWARE (Alternativa al enableCors en main.ts)
    // Usa este middleware si necesitas lógica CORS más personalizada
    consumer.apply(CorsMiddleware).forRoutes('*');
    // 2. RATE LIMIT MIDDLEWARE
    // Limita el número de peticiones por IP
    // Configura en .env:
    //   RATE_LIMIT_WINDOW_MS=60000 (ventana de tiempo en ms)
    //   RATE_LIMIT_MAX_REQUESTS=100 (máximo de requests por ventana)
    // consumer.apply(RateLimitMiddleware).forRoutes('*');
    // 3. APLICAR MÚLTIPLES MIDDLEWARES
    // consumer
    //   .apply(CorsMiddleware, RateLimitMiddleware)
    //   .forRoutes('*');
  }
}
