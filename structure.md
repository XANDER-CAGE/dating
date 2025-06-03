# Архитектура Backend для Dating App (NestJS)

## Основные компоненты системы

### 1. Модули приложения
```
src/
├── auth/                 # Аутентификация и авторизация
├── users/               # Управление пользователями
├── profiles/            # Профили пользователей
├── matching/            # Алгоритм матчинга
├── swipes/              # Система лайков/дислайков
├── chats/               # Система сообщений
├── media/               # Загрузка и управление файлами
├── notifications/       # Push уведомления
├── reports/             # Система жалоб
├── subscriptions/       # Премиум подписки
└── common/              # Общие компоненты
```

### 2. База данных (PostgreSQL)

#### Основные таблицы:

**Users** - базовая информация о пользователях
```sql
- id (UUID, PRIMARY KEY)
- email (VARCHAR, UNIQUE)
- phone (VARCHAR, UNIQUE)
- password_hash (VARCHAR)
- is_verified (BOOLEAN)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**Profiles** - профили пользователей
```sql
- id (UUID, PRIMARY KEY)
- user_id (UUID, FK to Users)
- name (VARCHAR)
- bio (TEXT)
- age (INTEGER)
- gender (ENUM: male, female, other)
- interested_in (ENUM: male, female, both)
- location (POINT) // PostGIS для геолокации
- max_distance (INTEGER) // км
- photos (JSONB) // массив URL фото
- interests (JSONB) // массив интересов
- is_premium (BOOLEAN)
- last_active (TIMESTAMP)
```

**Swipes** - действия пользователей
```sql
- id (UUID, PRIMARY KEY)
- swiper_id (UUID, FK to Users)
- swiped_id (UUID, FK to Users)
- action (ENUM: like, dislike, super_like)
- created_at (TIMESTAMP)
- UNIQUE(swiper_id, swiped_id)
```

**Matches** - совпадения
```sql
- id (UUID, PRIMARY KEY)
- user1_id (UUID, FK to Users)
- user2_id (UUID, FK to Users)
- created_at (TIMESTAMP)
- is_active (BOOLEAN)
- UNIQUE(user1_id, user2_id)
```

**Messages** - сообщения в чатах
```sql
- id (UUID, PRIMARY KEY)
- match_id (UUID, FK to Matches)
- sender_id (UUID, FK to Users)
- content (TEXT)
- message_type (ENUM: text, image, gif)
- is_read (BOOLEAN)
- created_at (TIMESTAMP)
```

### 3. Технологический стек

**Backend:**
- NestJS (Node.js framework)
- TypeScript
- PostgreSQL + PostGIS (для геолокации)
- Redis (кэширование, сессии, очереди)
- TypeORM (ORM)
- JWT (аутентификация)
- Socket.io (real-time сообщения)
- Bull (очереди задач)
- AWS S3 / Cloudinary (хранение медиа)

**Дополнительные сервисы:**
- Firebase Cloud Messaging (push уведомления)
- Twilio / SMS.ru (SMS верификация)
- Elasticsearch (поиск и рекомендации)

### 4. Ключевые функции

#### Аутентификация (Auth Module)
- Регистрация по email/телефону
- JWT токены (access + refresh)
- Верификация через SMS/Email
- Social login (Google, Facebook, Apple)

#### Профили (Profiles Module)
- CRUD операции с профилями
- Загрузка и обработка фото
- Геолокация пользователей
- Фильтры поиска

#### Матчинг (Matching Module)
- Алгоритм подбора кандидатов
- Фильтрация по возрасту, расстоянию, интересам
- Исключение уже просмотренных профилей
- Boost и Super Like функции

#### Чаты (Chats Module)
- Real-time сообщения через WebSocket
- История сообщений
- Статусы прочтения
- Отправка медиа файлов

### 5. API Endpoints

```typescript
// Auth
POST   /auth/register
POST   /auth/login
POST   /auth/refresh
POST   /auth/verify
POST   /auth/forgot-password

// Profiles
GET    /profiles/me
PUT    /profiles/me
POST   /profiles/photos
DELETE /profiles/photos/:id
GET    /profiles/candidates

// Swipes
POST   /swipes
GET    /swipes/history

// Matches
GET    /matches
DELETE /matches/:id

// Chats
GET    /chats
GET    /chats/:matchId/messages
POST   /chats/:matchId/messages
PUT    /chats/:matchId/read

// Users
GET    /users/me
PUT    /users/me
DELETE /users/me
```

### 6. Архитектурные принципы

**Модульная архитектура:**
- Каждый модуль инкапсулирует свою логику
- Слабая связанность между модулями
- Использование событий для межмодульного взаимодействия

**Слоистая архитектура:**
```
Controllers -> Services -> Repositories -> Database
```

**Паттерны:**
- Repository pattern для работы с данными
- Factory pattern для создания сложных объектов
- Observer pattern для уведомлений
- Strategy pattern для алгоритмов матчинга

### 7. Безопасность

- Валидация всех входящих данных
- Rate limiting для API
- CORS настройки
- Хеширование паролей (bcrypt)
- Защита от SQL инъекций через ORM
- Логирование и мониторинг

### 8. Производительность

- Индексы в базе данных
- Кэширование в Redis
- Пагинация для списков
- Оптимизация запросов
- CDN для статических файлов
- Горизонтальное масштабирование

### 9. Мониторинг и логирование

- Winston для логирования
- Prometheus + Grafana для метрик
- Health checks
- Error tracking (Sentry)

## Готовые API endpoints:

### Authentication
- `POST /api/v1/auth/register` - Регистрация
- `POST /api/v1/auth/login` - Вход
- `POST /api/v1/auth/refresh` - Обновление токена
- `POST /api/v1/auth/verify-email` - Верификация email

### Profiles
- `POST /api/v1/profiles` - Создание профиля
- `GET /api/v1/profiles/me` - Получение своего профиля
- `PUT /api/v1/profiles/me` - Обновление профиля
- `GET /api/v1/profiles/candidates` - Получение кандидатов

### Swipes & Matches
- `POST /api/v1/swipes` - Лайк/дислайк
- `GET /api/v1/swipes/history` - История свайпов
- `DELETE /api/v1/swipes/undo` - Отмена последнего свайпа
- `GET /api/v1/matches` - Список матчей
- `DELETE /api/v1/matches/:id` - Анматч

### Chat
- `GET /api/v1/chats` - Список чатов
- `GET /api/v1/chats/:matchId/messages` - Сообщения
- `POST /api/v1/chats/:matchId/messages` - Отправка сообщения
- `PUT /api/v1/chats/:matchId/read` - Отметка как прочитано

### Media
- `POST /api/v1/media/profile-photo` - Загрузка фото профиля
- `POST /api/v1/media/chat-media/:matchId` - Загрузка медиа в чат
- `DELETE /api/v1/media/file` - Удаление файла