# 🌱 Полное руководство по Сидам (Seeds)

### 1. **Демо за 30 секунд**
```bash
# Полная настройка демо с историей знакомства
npm run demo

# Или поэтапно:
npm run seed:clear    # Очистить БД
npm run seed:demo     # Создать демо данные
```

**Результат:** готовая история знакомства Анны и Александра с диалогом!

### 2. **Полное заполнение БД**
```bash
# Основные пользователи + 50 случайных с геолокацией
npm run seed:all
npm run seed:location:50

# Или все сразу:
npm run db:fresh
```

## 📂 Где размещать сиды

### Рекомендуемая структура:
```
project/
├── database/           # 📁 Всё для БД
│   ├── migrations/    # Миграции
│   ├── seeds/         # 🌱 СИДЫ
│   │   ├── index.ts   # Координатор
│   │   ├── users.seed.ts
│   │   ├── profiles.seed.ts
│   │   ├── location.seed.ts
│   │   └── demo.seed.ts
│   └── factories/     # Фабрики данных
├── scripts/           # 🚀 Скрипты запуска
│   ├── seed.ts
│   └── demo-setup.ts
└── package.json       # Команды npm
```

### Альтернативные варианты:
```
# Вариант 1: В src
src/database/seeds/

# Вариант 2: В корне
seeds/

# Вариант 3: Для тестов
test/fixtures/
test/seeds/
```

## 🎯 Типы сидов и их назначение

### 1. **Базовые сиды** (`users.seed.ts`, `profiles.seed.ts`)
- Минимальные данные для работы приложения
- Тестовые аккаунты разработчиков
- Обязательные справочники

```bash
npm run seed:all
```

### 2. **Демо сиды** (`demo.seed.ts`)
- Красивые данные для презентаций
- Готовые сценарии использования
- Для демонстрации клиентам

```bash
npm run seed:demo
```

### 3. **Нагрузочные сиды** (`location.seed.ts`)
- Большие объемы данных
- Для тестирования производительности
- Статистически корректные данные

```bash
npm run seed:location:1000  # 1000 пользователей
```

### 4. **Тестовые сиды**
- Предсказуемые данные для автотестов
- Граничные случаи
- Специфические сценарии

## 📝 Команды для работы с сидами

### Основные команды:
```bash
npm run seed:all          # Все базовые сиды
npm run seed:demo         # Только демо
npm run seed:clear        # Очистить БД
npm run seed:reset        # Очистить + заполнить
npm run seed:location     # Геолокационные данные (50 шт)
npm run seed:location:200 # 200 пользователей с локацией

npm run demo              # Быстрая настройка демо
npm run db:fresh          # Миграции + сиды
npm run db:demo           # Миграции + демо
```

### Продвинутые команды:
```bash
# Кастомное количество
npm run seed location 500

# Только пользователи
npm run seed users

# Цепочка команд
npm run seed:clear && npm run seed:demo && npm run seed:location:100
```

## 🏭 Фабрики данных (Factories)

### Создание фабрики пользователей:
```typescript
// database/factories/user.factory.ts
import { faker } from '@faker-js/faker/locale/ru';

export class UserFactory {
  static create(overrides: Partial<User> = {}): Partial<User> {
    return {
      email: faker.internet.email(),
      phone: faker.phone.number('+7 ### ### ## ##'),
      passwordHash: '$2b$12$hashedpassword',
      isVerified: faker.datatype.boolean(),
      isActive: true,
      ...overrides,
    };
  }

  static createMany(count: number): Partial<User>[] {
    return Array.from({ length: count }, () => this.create());
  }
}
```

### Использование фабрик:
```typescript
// В сидах
const users = UserFactory.createMany(100);
const russianUsers = UserFactory.createMany(50, { 
  country: 'Россия' 
});
```

## 🎨 Лучшие практики

### 1. **Идемпотентность**
Сиды должны работать многократно без ошибок:

```typescript
// ✅ Правильно
const existingUser = await userRepo.findOne({ where: { email } });
if (existingUser) {
  console.log('Пользователь уже существует');
  return existingUser;
}
return userRepo.save(newUser);

// ❌ Неправильно  
return userRepo.save(newUser); // Ошибка при повторном запуске
```

### 2. **Логирование прогресса**
```typescript
console.log('👥 Создание пользователей...');
for (let i = 0; i < users.length; i++) {
  // ... создание пользователя
  if ((i + 1) % 10 === 0) {
    console.log(`✅ Создано ${i + 1}/${users.length} пользователей`);
  }
}
```

### 3. **Обработка ошибок**
```typescript
try {
  await userRepo.save(user);
  console.log(`✅ Создан: ${user.email}`);
} catch (error) {
  console.error(`❌ Ошибка создания ${user.email}:`, error.message);
  // Продолжаем выполнение
}
```

### 4. **Зависимости между сидами**
```typescript
// Правильный порядок
await runUserSeeds();      // 1. Сначала пользователи
await runProfileSeeds();   // 2. Затем профили  
await runSwipeSeeds();     // 3. Потом действия
await runMatchSeeds();     // 4. Матчи
await runMessageSeeds();   // 5. Сообщения
```

## 📊 Примеры реальных данных

### Российские города с координатами:
```typescript
const RUSSIAN_CITIES = [
  { name: 'Москва', lat: 55.7558, lng: 37.6176 },
  { name: 'Санкт-Петербург', lat: 59.9311, lng: 30.3609 },
  { name: 'Екатеринбург', lat: 56.8431, lng: 60.6454 },
  { name: 'Новосибирск', lat: 55.0084, lng: 82.9357 },
  { name: 'Казань', lat: 55.8304, lng: 49.0661 },
];
```

### Реалистичные интересы:
```typescript
const INTERESTS = [
  'путешествия', 'спорт', 'музыка', 'кино', 'книги',
  'кулинария', 'фотография', 'танцы', 'йога', 
  'программирование', 'дизайн', 'искусство'
];
```

### Правдоподобные профили:
```typescript
const profiles = [
  {
    name: 'Анна', age: 25, bio: '🎨 Дизайнер в IT',
    interests: ['дизайн', 'кофе', 'путешествия']
  },
  {
    name: 'Александр', age: 28, bio: '💻 Full-stack разработчик',
    interests: ['программирование', 'спорт', 'книги']
  },
];
```

## 🧪 Сценарии тестирования

### 1. **История знакомства** (демо)
- Анна и Александр матчатся
- Обмениваются сообщениями  
- Назначают встречу

### 2. **Геолокационный поиск**
- Пользователи в разных районах Москвы
- Различные радиусы поиска
- Фильтры по возрасту/полу

### 3. **Массовые данные**
- 1000+ пользователей
- Разные города России  
- Статистически корректное распределение

## 🔧 Отладка и troubleshooting

### Частые проблемы:

**1. Дублирование данных**
```bash
# Решение: проверки на существование
const existing = await repo.findOne({ where: { email } });
if (existing) return existing;
```

**2. Нарушение внешних ключей**
```bash
# Решение: правильный порядок создания
await createUsers();    // Сначала родители
await createProfiles(); // Потом дети
```

**3. Медленное выполнение**
```bash
# Решение: батчинг
const batch = await repo.save(users); // Вместо по одному
```

### Полезные команды для отладки:
```bash
# Проверить состояние БД
npm run typeorm schema:log

# Откатить миграции
npm run typeorm:migration:revert

# Пересоздать с нуля
npm run db:fresh
```

## 🎉 Готовые сценарии использования

### Для разработки:
```bash
npm run db:fresh        # Чистая БД + базовые данные
npm run seed:location:20 # + немного геоданных
```

### Для демо/презентации:
```bash
npm run demo            # Красивая история + кандидаты
```

### Для нагрузочного тестирования:
```bash
npm run seed:clear
npm run seed:location:10000  # 10к пользователей
```

### Для CI/CD:
```bash
npm run db:reset && npm run seed:demo
```

## 📈 Мониторинг и аналитика

После запуска сидов проверьте:

```sql
-- Количество пользователей
SELECT COUNT(*) FROM users;

-- Пользователи с локацией
SELECT COUNT(*) FROM profiles WHERE latitude IS NOT NULL;

-- Топ городов
SELECT city, COUNT(*) as users_count 
FROM profiles 
GROUP BY city 
ORDER BY users_count DESC;

-- Матчи
SELECT COUNT(*) FROM matches WHERE "isActive" = true;
```