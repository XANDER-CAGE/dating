import { DataSource } from 'typeorm';
import { Profile, Gender, InterestedIn } from '../../src/profiles/entities/profile.entity';
import { User } from '../../src/users/entities/user.entity';
import * as bcrypt from 'bcrypt';

// Координаты популярных городов России
const RUSSIAN_CITIES = [
  { name: 'Москва', lat: 55.7558, lng: 37.6176, country: 'Россия' },
  { name: 'Санкт-Петербург', lat: 59.9311, lng: 30.3609, country: 'Россия' },
  { name: 'Екатеринбург', lat: 56.8431, lng: 60.6454, country: 'Россия' },
  { name: 'Новосибирск', lat: 55.0084, lng: 82.9357, country: 'Россия' },
  { name: 'Казань', lat: 55.8304, lng: 49.0661, country: 'Россия' },
  { name: 'Нижний Новгород', lat: 56.2965, lng: 43.9361, country: 'Россия' },
  { name: 'Челябинск', lat: 55.1644, lng: 61.4368, country: 'Россия' },
  { name: 'Самара', lat: 53.2001, lng: 50.1500, country: 'Россия' },
];

const FEMALE_NAMES = [
  'Анна', 'Мария', 'Елена', 'Ольга', 'София', 'Анастасия', 'Екатерина', 
  'Дарья', 'Полина', 'Александра', 'Виктория', 'Юлия', 'Татьяна', 'Ирина'
];

const MALE_NAMES = [
  'Александр', 'Дмитрий', 'Максим', 'Сергей', 'Андрей', 'Алексей', 'Артём',
  'Илья', 'Кирилл', 'Михаил', 'Никита', 'Матвей', 'Роман', 'Даниил'
];

const INTERESTS = [
  'путешествия', 'спорт', 'музыка', 'кино', 'книги', 'кулинария', 'фотография',
  'танцы', 'йога', 'программирование', 'дизайн', 'искусство', 'театр', 'концерты',
  'природа', 'велосипед', 'бег', 'плавание', 'психология', 'наука', 'автомобили'
];

// Генерируем случайные координаты в радиусе города
function generateCityCoordinates(cityLat: number, cityLng: number, radiusKm: number = 15) {
  const radiusDeg = radiusKm / 111; // Приблизительно км в градусы
  const angle = Math.random() * 2 * Math.PI;
  const distance = Math.random() * radiusDeg;
  
  return {
    latitude: cityLat + (distance * Math.cos(angle)),
    longitude: cityLng + (distance * Math.sin(angle)),
  };
}

// Генерируем случайные интересы
function generateRandomInterests(): string[] {
  const count = Math.floor(Math.random() * 4) + 2; // 2-6 интересов
  return INTERESTS.sort(() => 0.5 - Math.random()).slice(0, count);
}

export async function runLocationSeeds(dataSource: DataSource, count: number = 50): Promise<void> {
  console.log(`🗺️  Создание ${count} пользователей с геолокацией...`);
  
  const userRepository = dataSource.getRepository(User);
  const profileRepository = dataSource.getRepository(Profile);
  
  for (let i = 0; i < count; i++) {
    try {
      // Выбираем случайный город
      const city = RUSSIAN_CITIES[Math.floor(Math.random() * RUSSIAN_CITIES.length)];
      
      // Выбираем пол и имя
      const gender = Math.random() > 0.5 ? Gender.FEMALE : Gender.MALE;
      const names = gender === Gender.FEMALE ? FEMALE_NAMES : MALE_NAMES;
      const name = names[Math.floor(Math.random() * names.length)];
      
      // Генерируем email
      const email = `${name.toLowerCase()}.${city.name.toLowerCase()}${i}@test.com`;
      
      // Проверяем, не существует ли пользователь
      const existingUser = await userRepository.findOne({ where: { email } });
      if (existingUser) continue;
      
      // Создаем пользователя
      const passwordHash = await bcrypt.hash('Test123456', 12);
      const user = userRepository.create({
        email,
        passwordHash,
        phone: `+7999${String(1000000 + i).substring(0, 7)}`,
        isVerified: true,
        isActive: true,
      });
      
      const savedUser = await userRepository.save(user);
      
      // Генерируем координаты в городе
      const coordinates = generateCityCoordinates(city.lat, city.lng);
      
      // Создаем профиль
      const profile = profileRepository.create({
        userId: savedUser.id,
        name,
        age: Math.floor(Math.random() * 15) + 20, // 20-35 лет
        gender,
        interestedIn: gender === Gender.FEMALE ? InterestedIn.MALE : InterestedIn.FEMALE,
        bio: `Привет! Меня зовут ${name}, живу в городе ${city.name}. ${generateRandomInterests().slice(0, 2).join(' и ')} - мои главные увлечения.`,
        latitude: Math.round(coordinates.latitude * 10000) / 10000,
        longitude: Math.round(coordinates.longitude * 10000) / 10000,
        city: city.name,
        country: city.country,
        interests: generateRandomInterests(),
        photos: [`https://i.pravatar.cc/400?img=${i + 20}`],
        maxDistance: [10, 25, 50, 100][Math.floor(Math.random() * 4)],
        isPremium: Math.random() > 0.8, // 20% премиум пользователей
        isLocationVisible: Math.random() > 0.1, // 90% показывают локацию
        lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Активны в последние 7 дней
      });
      
      await profileRepository.save(profile);
      
      if ((i + 1) % 10 === 0) {
        console.log(`✅ Создано ${i + 1}/${count} пользователей...`);
      }
      
    } catch (error) {
      console.error(`❌ Ошибка создания пользователя ${i}:`, error.message);
    }
  }
  
  console.log(`🗺️  Создание геолокационных данных завершено!`);
}