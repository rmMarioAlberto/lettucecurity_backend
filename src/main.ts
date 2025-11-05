import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { config } from 'dotenv';
import { AllExceptionsFilter } from "./utils/exceptions.filter";
import { RateLimitMiddleware } from './utils/rate-limit.middleware';

config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina propiedades no definidas en el DTO
      forbidNonWhitelisted: true, // Lanza error si hay propiedades extras
      transform: true, // Transforma los tipos automáticamente
      transformOptions: {
        enableImplicitConversion: true, // Convierte tipos implícitamente
      },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.use(new RateLimitMiddleware().use);
  await app.listen(process.env.PORT ?? 3000);
  console.log(`API corriendo en http://localhost:${process.env.PORT ?? 3000}`);
}
bootstrap();