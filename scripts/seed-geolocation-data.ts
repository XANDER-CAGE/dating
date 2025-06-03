// scripts/seed-geolocation-data.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/users/users.service';
import { ProfilesService } from '../src/profiles/profiles.service';
import { AuthService } from '../src/auth/auth.service';
import { Gender, InterestedIn } from '../src/profiles/entities/profile.entity';

interface TestUser {
  email: string;
  password: string;
  profile: {
    name: string;
    age: number;
    gender: Gender;
    interestedIn: InterestedIn;
    bio: string;
    latitude: number;
    longitude: number;
    city: string;
    country: string;
    interests: string[];
    photos: string[];
  };
}

// Тестовые пользователи с координатами в разных районах Москвы
const testUsers: TestUser[] = [
  {
    email: 'anna.moscow@test.com',
    password: 'Test123456',
    profile: {
      name: 'Анна',
      age: 25,
      gender: Gender.FEMALE,
      interestedIn: InterestedIn.MALE,
      bio: 'Люблю прогулки по центру Москвы и кофе в уютных кафе',
      latitude: 55.7558, // Красная площадь
      longitude: 37.6176,
      city: 'Москва',
      country: 'Россия',
      interests: ['кофе', 'прогулки', 'музеи', 'театр'],
      photos: ['https://i.pravatar.cc/400?img=1'],
    },
  },
  {
    email: 'maria.arbat@test.com',
    password: 'Test123456',
    profile: {
      name: 'Мария',
      age: 28,
      gender: Gender.FEMALE,
      interestedIn: InterestedIn.MALE,
      bio: 'Живу рядом с Арбатом, работаю в IT',
      latitude: 55.7522, // Арбат
      longitude: 37.5936,
      city: 'Москва',
      country: 'Россия',
      interests: ['IT', 'программирование', 'книги', 'йога'],
      photos: ['https://i.pravatar.cc/400?img=2'],
    },
  },
  {
    email: 'alex.sokolniki@test.com',
    password: 'Test123456',
    profile: {
      name: 'Александр',
      age: 30,
      gender: Gender.MALE,
      interestedIn: InterestedIn.FEMALE,
      bio: 'Люблю активный отдых и природу. Часто в Сокольниках',
      latitude: 55.7935, // Сокольники
      longitude: 37.6703,
      city: 'Москва', 
      country: 'Россия',
      interests: ['спорт', 'велосипед', 'природа', 'фотография'],
      photos: ['https://i.pravatar.cc/400?img=3'],
    },
  },
  {
    email: 'kate.msu@test.com',
    password: 'Test123456',
    profile: {
      name: 'Екатерина',
      age: 22,
      gender: Gender.FEMALE,
      interestedIn: InterestedIn.MALE,
      bio: 'Студентка МГУ, изучаю психологию',
      latitude: 55.7033, // МГУ
      longitude: 37.5302,
      city: 'Москва',
      country: 'Россия',
      interests: ['психология', 'наука', 'чтение', 'музыка'],
      photos: ['https://i.pravatar.cc/400?img=4'],
    },
  },
  {
    email: 'dmitry.vdnh@test.com',
    password: 'Test123456',
    profile: {
      name: 'Дмитрий',
      age: 27,
      gender: Gender.MALE,
      interestedIn: InterestedIn.FEMALE,
      bio: 'Инженер, живу рядом с ВДНХ',
      latitude: 55.8215, // ВДНХ
      longitude: 37.6398,
      city: 'Москва',
      country: 'Россия',
      interests: ['технологии', 'инженерия', 'выставки', 'космос'],
      photos: ['https://i.pravatar.cc/400?img=5'],
    },
  },
  {
    email: 'elena.spb@test.com',
    password: 'Test123456',
    profile: {
      name: 'Елена',
      age: 26,
      gender: Gender.FEMALE,
      interestedIn: InterestedIn.MALE,
      bio: 'Из Санкт-Петербурга, люблю белые ночи и разводные мосты',
      latitude: 59.9311, // Санкт-Петербург центр
      longitude: 30.3609,
      city: 'Санкт-Петербург',
      country: 'Россия',
      interests: ['архитектура', 'история', 'искусство', 'балет'],
      photos: ['https://i.pravatar.cc/400?img=6'],
    },
  },
  {
    email: 'igor.moscow@test.com',
    password: 'Test123456',
    profile: {
      name: 'Игорь',
      age: 29,
      gender: Gender.MALE,
      interestedIn: InterestedIn.FEMALE,
      bio: 'Предприниматель, живу в центре Москвы',
      latitude: 55.7611, // Тверская
      longitude: 37.6186,
      city: 'Москва',
      country: 'Россия',
      interests: ['бизнес', 'путешествия', 'рестораны', 'автомобили'],
      photos: ['https://i.pravatar.cc/400?img=7'],
    },
  },
  {
    email: 'vera.taganka@test.com',
    password: 'Test123456',
    profile: {
      name: 'Вера',
      age: 24,
      gender: Gender.FEMALE,
      interestedIn: InterestedIn.MALE,
      bio: 'Художница, живу в районе Таганки',
      latitude: 55.7423, // Таганка
      longitude: 37.6534,
      city: 'Москва',
      country: 'Россия',
      interests: ['живопись', 'искусство', 'выставки', 'творчество'],
      photos: ['https://i.pravatar.cc/400?img=8'],
    },
  },
];

async function seedGeolocationData() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const authService = app.get(AuthService);
  const profilesService = app.get(ProfilesService);

  console.log('🌱 Начинаем заполнение тестовыми данными с геолокацией...');

  for (const testUser of testUsers) {
    try {
      // Регистрируем пользователя
      console.log(`📝 Регистрируем пользователя: ${testUser.profile.name} (${testUser.email})`);
      
      const authResult = await authService.register({
        email: testUser.email,
        password: testUser.password,
      });

      // Создаем профиль
      console.log(`👤 Создаем профиль для: ${testUser.profile.name}`);
      
      await profilesService.create(authResult.user.id, testUser.profile);

      console.log(`✅ Успешно создан профиль: ${testUser.profile.name} в ${testUser.profile.city}`);
      
    } catch (error) {
      console.error(`❌ Ошибка создания пользователя ${testUser.email}:`, error.message);
    }
  }

  console.log('🎉 Заполнение тестовыми данными завершено!');
  console.log('\n📍 Созданы пользователи в следующих локациях:');
  console.log('• Москва (центр): Анна, Игорь');
  console.log('• Москва (Арбат): Мария');  
  console.log('• Москва (Сокольники): Александр');
  console.log('• Москва (МГУ): Екатерина');
  console.log('• Москва (ВДНХ): Дмитрий');
  console.log('• Москва (Таганка): Вера');
  console.log('• Санкт-Петербург: Елена');
  
  console.log('\n🧪 Примеры тестирования:');
  console.log('1. Войдите как anna.moscow@test.com');
  console.log('2. Сделайте поиск поблизости с координатами центра Москвы');
  console.log('3. Попробуйте разные радиусы поиска (1км, 5км, 25км)');
  console.log('4. Протестируйте поиск по городу "Москва"');

  await app.close();
}

// Функция для генерации дополнительных случайных пользователей
function generateRandomUsers(count: number = 20): TestUser[] {
  const names = {
    female: ['София', 'Анастасия', 'Дарья', 'Полина', 'Александра', 'Виктория', 'Елизавета', 'Ксения'],
    male: ['Александр', 'Максим', 'Артём', 'Михаил', 'Даниил', 'Никита', 'Илья', 'Андрей'],
  };
  
  const cities = [
    { name: 'Москва', lat: 55.7558, lng: 37.6176, country: 'Россия' },
    { name: 'Санкт-Петербург', lat: 59.9311, lng: 30.3609, country: 'Россия' },
    { name: 'Екатеринбург', lat: 56.8431, lng: 60.6454, country: 'Россия' },
    { name: 'Новосибирск', lat: 55.0084, lng: 82.9357, country: 'Россия' },
    { name: 'Казань', lat: 55.8304, lng: 49.0661, country: 'Россия' },
  ];

  const interests = [
    'путешествия', 'спорт', 'музыка', 'кино', 'книги', 'кулинария', 
    'фотография', 'танцы', 'йога', 'программирование', 'дизайн',
    'искусство', 'театр', 'концерты', 'природа', 'велосипед'
  ];

  const users: TestUser[] = [];

  for (let i = 0; i < count; i++) {
    const gender = Math.random() > 0.5 ? Gender.FEMALE : Gender.MALE;
    const interestedIn = gender === Gender.FEMALE ? InterestedIn.MALE : InterestedIn.FEMALE;
    const name = names[gender][Math.floor(Math.random() * names[gender].length)];
    const city = cities[Math.floor(Math.random() * cities.length)];
    
    // Генерируем координаты в радиусе 15км от центра города
    const radiusKm = 15;
    const radiusDeg = radiusKm / 111;
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * radiusDeg;
    
    const latitude = city.lat + (distance * Math.cos(angle));
    const longitude = city.lng + (distance * Math.sin(angle));
    
    const userInterests = interests
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(Math.random() * 4) + 2);

    users.push({
      email: `test${i + 1}@example.com`,
      password: 'Test123456',
      profile: {
        name,
        age: Math.floor(Math.random() * 15) + 20, // 20-35 лет
        gender,
        interestedIn,
        bio: `Привет! Меня зовут ${name}, живу в ${city.name}. Люблю ${userInterests.slice(0, 2).join(' и ')}.`,
        latitude: Math.round(latitude * 10000) / 10000,
        longitude: Math.round(longitude * 10000) / 10000,
        city: city.name,
        country: city.country,
        interests: userInterests,
        photos: [`https://i.pravatar.cc/400?img=${i + 10}`],
      },
    });
  }

  return users;
}

// Экспортируем функции для использования
export { seedGeolocationData, generateRandomUsers, testUsers };

// Если файл запущен напрямую
if (require.main === module) {
  seedGeolocationData().catch(console.error);
}