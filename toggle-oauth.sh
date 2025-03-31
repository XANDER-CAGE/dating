#!/bin/bash

# Скрипт для включения/выключения OAuth аутентификации
# Использование: ./toggle-oauth.sh [enable|disable]

# Путь к файлу модуля аутентификации
AUTH_MODULE="src/auth/auth.module.ts"
GOOGLE_STRATEGY="src/auth/strategies/google.strategy.ts"
FACEBOOK_STRATEGY="src/auth/strategies/facebook.strategy.ts"

# Создаем резервные копии файлов при первом запуске, если их еще нет
if [ ! -f "${AUTH_MODULE}.bak" ]; then
  echo "Создание резервных копий файлов..."
  cp -f "$AUTH_MODULE" "${AUTH_MODULE}.bak"
  cp -f "$GOOGLE_STRATEGY" "${GOOGLE_STRATEGY}.bak"
  cp -f "$FACEBOOK_STRATEGY" "${FACEBOOK_STRATEGY}.bak"
fi

function enable_oauth() {
  echo "Включение OAuth аутентификации..."
  
  # Восстанавливаем оригинальный модуль аутентификации
  if [ -f "${AUTH_MODULE}.bak" ]; then
    cp -f "${AUTH_MODULE}.bak" "$AUTH_MODULE"
    echo "Восстановлен оригинальный модуль аутентификации."
  else
    echo "Предупреждение: Файл резервной копии ${AUTH_MODULE}.bak не найден."
  fi
  
  # Восстанавливаем стратегии
  if [ -f "${GOOGLE_STRATEGY}.bak" ]; then
    cp -f "${GOOGLE_STRATEGY}.bak" "$GOOGLE_STRATEGY"
    echo "Восстановлена Google стратегия."
  else
    echo "Предупреждение: Файл резервной копии ${GOOGLE_STRATEGY}.bak не найден."
  fi
  
  if [ -f "${FACEBOOK_STRATEGY}.bak" ]; then
    cp -f "${FACEBOOK_STRATEGY}.bak" "$FACEBOOK_STRATEGY"
    echo "Восстановлена Facebook стратегия."
  else
    echo "Предупреждение: Файл резервной копии ${FACEBOOK_STRATEGY}.bak не найден."
  fi
  
  # Проверяем наличие необходимых переменных окружения
  if [ ! -f .env.development ]; then
    echo "Создание файла .env.development с необходимыми переменными..."
    cat > .env.development << 'EOF'
# База данных
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=dating_app
DB_SYNC=true
DB_LOGGING=true

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRATION=1h
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here
JWT_REFRESH_EXPIRATION=7d

# OAuth
GOOGLE_CLIENT_ID=dummy_google_id
GOOGLE_CLIENT_SECRET=dummy_google_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

FACEBOOK_CLIENT_ID=dummy_facebook_id
FACEBOOK_CLIENT_SECRET=dummy_facebook_secret
FACEBOOK_CALLBACK_URL=http://localhost:3000/api/auth/facebook/callback

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Приложение
PORT=3000
CORS_ORIGIN=*
NODE_ENV=development

# Подписки
SUBSCRIPTION_PRICE_MONTHLY=9.99
SUBSCRIPTION_PRICE_QUARTERLY=24.99
SUBSCRIPTION_PRICE_YEARLY=79.99
EOF
  else
    # Проверяем наличие OAuth переменных в файле
    if ! grep -q "GOOGLE_CLIENT_ID" .env.development || ! grep -q "FACEBOOK_CLIENT_ID" .env.development; then
      echo "Добавление переменных OAuth в файл .env.development..."
      cat >> .env.development << 'EOF'

# OAuth
GOOGLE_CLIENT_ID=dummy_google_id
GOOGLE_CLIENT_SECRET=dummy_google_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

FACEBOOK_CLIENT_ID=dummy_facebook_id
FACEBOOK_CLIENT_SECRET=dummy_facebook_secret
FACEBOOK_CALLBACK_URL=http://localhost:3000/api/auth/facebook/callback
EOF
    fi
  fi

  echo "OAuth аутентификация включена."
}

function disable_oauth() {
  echo "Отключение OAuth аутентификации..."
  
  # Модифицируем модуль аутентификации
  cat > "$AUTH_MODULE" << 'EOF'
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './strategies/jwt.strategy';
// Временно отключаем OAuth стратегии
// import { GoogleStrategy } from './strategies/google.strategy';
// import { FacebookStrategy } from './strategies/facebook.strategy';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET', 'default_jwt_secret'),
        signOptions: { 
          expiresIn: configService.get('JWT_EXPIRATION', '1h') 
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService, 
    JwtStrategy,
    // Временно отключаем OAuth стратегии
    // GoogleStrategy,
    // FacebookStrategy
  ],
  exports: [AuthService],
})
export class AuthModule {}
EOF

  echo "OAuth аутентификация отключена."
}

# Проверяем аргументы
if [ $# -eq 0 ]; then
  echo "Ошибка: Не указан режим работы."
  echo "Использование: ./toggle-oauth.sh [enable|disable]"
  exit 1
fi

case "$1" in
  enable)
    enable_oauth
    ;;
  disable)
    disable_oauth
    ;;
  *)
    echo "Ошибка: Неизвестный режим: $1"
    echo "Использование: ./toggle-oauth.sh [enable|disable]"
    exit 1
    ;;
esac

echo "Завершено! Запустите 'nest start' для применения изменений."