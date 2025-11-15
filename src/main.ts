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
  // DESACTIVAR bodyParser interno de Nest
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  // CORS
  const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((s) => s.trim())
    : ['*'];

  app.enableCors({
    origin: corsOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Activar body parser con límite
  app.use(bodyParser.json({ limit: '20mb' }));
  app.use(bodyParser.urlencoded({ limit: '20mb', extended: true }));

  // cookies
  app.use(cookieParser());

  // Pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Lettucecurity API')
    .setDescription('API documentation for Lettucecurity application')
    .setVersion('1.0')
    .addTag('lettucecurity')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  // Filtros y rate limit
  app.useGlobalFilters(new AllExceptionsFilter());
  app.use(new RateLimitMiddleware().use);

  await app.listen(process.env.PORT ?? 3000);
  console.log(`API corriendo en http://localhost:${process.env.PORT ?? 3000}`);
}

bootstrap();
