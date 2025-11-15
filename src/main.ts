import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { config } from 'dotenv';
import { AllExceptionsFilter } from './utils/exceptions.filter';
import { RateLimitMiddleware } from './utils/rate-limit.middleware';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';

config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configurar CORS global. Usa la variable de entorno CORS_ORIGINS (coma-separada)
  // o por defecto permitir el frontend en 5173 durante desarrollo.
  const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((s) => s.trim())
    : ['*'];

  app.enableCors({
    origin: corsOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

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

  app.use(bodyParser.json({ limit: '20mb' }));
  app.use(bodyParser.urlencoded({ limit: '20mb', extended: true }));

  app.use(cookieParser());

  app.useGlobalFilters(new AllExceptionsFilter());
  app.use(new RateLimitMiddleware().use);
  await app.listen(process.env.PORT ?? 3000);
  console.log(`API corriendo en http://localhost:${process.env.PORT ?? 3000}`);
}
bootstrap();
