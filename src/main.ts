import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { config } from 'dotenv';
import { AllExceptionsFilter } from './utils/exceptions.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import { CryptoInterceptor } from './crypto/crypto.interceptor';

config();

async function bootstrap() {
  // Crear aplicación sin bodyParser interno
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  // === ACTIVAR INTERCEPTOR DE CIFRADO GLOBAL ===
  const cryptoInterceptor = app.get(CryptoInterceptor);
  app.useGlobalInterceptors(cryptoInterceptor);

  // ============================================
  // BODY PARSER
  // ============================================
  const bodyLimit = process.env.BODY_LIMIT || '20mb';
  app.use(bodyParser.json({ limit: bodyLimit }));
  app.use(bodyParser.urlencoded({ limit: bodyLimit, extended: true }));

  // ============================================
  // COOKIES
  // ============================================
  app.use(cookieParser());

  // ============================================
  // VALIDATION PIPE
  // ============================================
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

  // ============================================
  // SWAGGER DOCUMENTATION
  // ============================================
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Lettucecurity API')
    .setDescription(
      'API documentation for Lettucecurity - Sistema de monitoreo de cultivos hidropónicos',
    )
    .setVersion('1.0')
    .build();

  const documentFactory = () =>
    SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, documentFactory, {
    customSiteTitle: 'Lettucecurity API Docs',
  });

  // ============================================
  // GLOBAL EXCEPTION FILTER
  // ============================================
  app.useGlobalFilters(new AllExceptionsFilter());

  // ============================================
  // START SERVER
  // ============================================
  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`
Servidor corriendo en: http://localhost:${port}       
Documentación Swagger: http://localhost:${port}/api  
`);
}

bootstrap();
