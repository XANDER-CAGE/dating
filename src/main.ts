import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Static files serving
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Dating App API')
    .setDescription('API для приложения знакомств')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Authentication', 'Регистрация и авторизация')
    .addTag('Users', 'Управление пользователями')
    .addTag('Profiles', 'Профили пользователей')
    .addTag('Swipes', 'Лайки и дислайки')
    .addTag('Matches', 'Матчи между пользователями')
    .addTag('Chats', 'Система сообщений')
    .addTag('Media', 'Загрузка медиа файлов')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Global prefix
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📖 Swagger docs: http://localhost:${port}/api/docs`);
  console.log(`💬 WebSocket Chat: ws://localhost:${port}/chat`);
}

bootstrap();