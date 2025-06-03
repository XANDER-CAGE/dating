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

  // Определяем префикс на основе окружения
  const apiPrefix = process.env.API_PREFIX || 
    (process.env.NODE_ENV === 'production' ? '' : '');
  
  // Устанавливаем глобальный префикс
  if (apiPrefix) {
    app.setGlobalPrefix(apiPrefix);
  }

  // Получаем информацию о сервере
  const port = process.env.PORT || 3000;
  const host = process.env.HOST || 'localhost';
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  
  // Строим базовый URL
  const baseUrl = `${protocol}://${host}:${port}`;
  const apiBaseUrl = apiPrefix ? `${baseUrl}/${apiPrefix}` : baseUrl;

  // Swagger configuration с умными серверами
  const config = new DocumentBuilder()
    .setTitle('Dating App API')
    .setDescription(`
## API для приложения знакомств

### Текущая конфигурация:
- **Среда**: ${process.env.NODE_ENV || 'development'}
- **Префикс API**: ${apiPrefix || 'нет'}
- **Базовый URL**: ${apiBaseUrl}

### Доступные серверы:
Выберите нужный сервер в выпадающем списке выше для тестирования.
    `)
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'JWT',
      description: 'Введите JWT токен',
      in: 'header',
    })
    // Добавляем разные серверы для разных сред
    .addServer(apiBaseUrl, `${process.env.NODE_ENV || 'development'} server`)
    .addServer(`http://localhost:3000/${apiPrefix}`, 'Local development')
    .addServer(`http://localhost:3000/`, 'Local with v1 prefix')
    .addServer(`http://localhost:3000`, 'Local without prefix')
    .addServer(`https://your-domain.com/`, 'Production server')
    .addTag('Authentication', 'Регистрация и авторизация')
    .addTag('Users', 'Управление пользователями')
    .addTag('Profiles', 'Профили пользователей')
    .addTag('Swipes', 'Лайки и дислайки')
    .addTag('Matches', 'Матчи между пользователями')
    .addTag('Chats', 'Система сообщений')
    .addTag('Media', 'Загрузка медиа файлов')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  
  // Настраиваем Swagger UI с дополнительными опциями
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Сохраняет токен авторизации
      tryItOutEnabled: true,      // Включает кнопки "Try it out"
      filter: true,               // Включает поиск по эндпоинтам
      displayRequestDuration: true, // Показывает время выполнения запросов
      defaultModelsExpandDepth: 2,  // Глубина раскрытия моделей
      defaultModelExpandDepth: 2,
      docExpansion: 'none',        // Сворачивает все секции по умолчанию
      operationsSorter: 'alpha',   // Сортирует операции по алфавиту
    },
    customSiteTitle: 'Dating App API Documentation',
    customfavIcon: '/favicon.ico',
    customJs: [
      // Добавляем кастомный JS для улучшения UX
      '/swagger-custom.js'
    ],
    customCssUrl: '/swagger-custom.css',
  });

  await app.listen(port);
  
  // Выводим полезную информацию при запуске
  console.log('\n🚀 Dating App API запущено!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📱 Приложение:     ${baseUrl}`);
  console.log(`📖 Swagger docs:   ${baseUrl}/api/docs`);
  console.log(`🔗 API endpoints:  ${apiBaseUrl}`);
  console.log(`💬 WebSocket:      ws://${host}:${port}/chat`);
  console.log(`🗃️  Uploads:        ${baseUrl}/uploads`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🌍 Среда:          ${process.env.NODE_ENV || 'development'}`);
  console.log(`📍 Префикс API:    ${apiPrefix || 'отсутствует'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Примеры запросов для быстрого тестирования
  console.log('🧪 Примеры запросов:');
  console.log(`   curl -X POST ${apiBaseUrl}/auth/register \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log(`     -d '{"email":"test@example.com","password":"Test123456"}'`);
  console.log('');
}

bootstrap();