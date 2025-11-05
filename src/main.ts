import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { config } from 'dotenv';
import { AllExceptionsFilter } from './utils/exceptions.filter';
import { RateLimitMiddleware } from './utils/rate-limit.middleware';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

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

  const config = new DocumentBuilder()
    .setTitle('Lettucecurity API')
    .setDescription('API documentation for Lettucecurity application')
    .setVersion('1.0')
    .addTag('lettucecurity')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  app.useGlobalFilters(new AllExceptionsFilter());
  app.use(new RateLimitMiddleware().use);
  await app.listen(process.env.PORT ?? 3000);
  console.log(`API corriendo en http://localhost:${process.env.PORT ?? 3000}`);
}
bootstrap();
