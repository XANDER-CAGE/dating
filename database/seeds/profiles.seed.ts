import { DataSource } from 'typeorm';
import { Profile, Gender, InterestedIn } from '../../src/profiles/entities/profile.entity';
import { User } from '../../src/users/entities/user.entity';

interface SeedProfile {
  userEmail: string; // Связываем по email
  name: string;
  age: number;
  gender: Gender;
  interestedIn: InterestedIn;
  bio: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  country?: string;
  interests: string[];
  photos: string[];
  maxDistance?: number;
  isPremium?: boolean;
}

const SEED_PROFILES: SeedProfile[] = [
  {
    userEmail: 'anna.moscow@test.com',
    name: 'Анна',
    age: 25,
    gender: Gender.FEMALE,
    interestedIn: InterestedIn.MALE,
    bio: 'Люблю прогулки по Москве, кофе и хорошие книги. Работаю в маркетинге.',
    latitude: 55.7558,
    longitude: 37.6176,
    city: 'Москва',
    country: 'Россия',
    interests: ['кофе', 'книги', 'маркетинг', 'путешествия', 'фотография'],
    photos: ['https://i.pravatar.cc/400?img=1'],
    maxDistance: 25,
    isPremium: false,
  },
  {
    userEmail: 'alex.moscow@test.com',
    name: 'Александр',
    age: 28,
    gender: Gender.MALE,
    interestedIn: InterestedIn.FEMALE,
    bio: 'IT-разработчик, увлекаюсь спортом и активным отдыхом. Ищу серьезные отношения.',
    latitude: 55.7522,
    longitude: 37.5936,
    city: 'Москва',
    country: 'Россия',
    interests: ['программирование', 'спорт', 'велосипед', 'кино', 'технологии'],
    photos: ['https://i.pravatar.cc/400?img=3'],
    maxDistance: 30,
    isPremium: true,
  },
  {
    userEmail: 'maria.spb@test.com',
    name: 'Мария',
    age: 26,
    gender: Gender.FEMALE,
    interestedIn: InterestedIn.MALE,
    bio: 'Дизайнер из Питера. Люблю искусство, театры и белые ночи.',
    latitude: 59.9311,
    longitude: 30.3609,
    city: 'Санкт-Петербург',
    country: 'Россия',
    interests: ['дизайн', 'искусство', 'театр', 'музеи', 'архитектура'],
    photos: ['https://i.pravatar.cc/400?img=2'],
    maxDistance: 20,
    isPremium: false,
  },
];

export async function runProfileSeeds(dataSource: DataSource): Promise<Profile[]> {
  console.log('👤 Создание профилей...');
  
  const profileRepository = dataSource.getRepository(Profile);
  const userRepository = dataSource.getRepository(User);
  const createdProfiles: Profile[] = [];

  for (const profileData of SEED_PROFILES) {
    // Находим пользователя по email
    const user = await userRepository.findOne({
      where: { email: profileData.userEmail }
    });

    if (!user) {
      console.error(`❌ Пользователь ${profileData.userEmail} не найден`);
      continue;
    }

    // Проверяем, есть ли уже профиль
    const existingProfile = await profileRepository.findOne({
      where: { userId: user.id }
    });

    if (existingProfile) {
      console.log(`⏭️  Профиль для ${profileData.userEmail} уже существует`);
      createdProfiles.push(existingProfile);
      continue;
    }

    // Создаем профиль
    const profile = profileRepository.create({
      userId: user.id,
      name: profileData.name,
      age: profileData.age,
      gender: profileData.gender,
      interestedIn: profileData.interestedIn,
      bio: profileData.bio,
      latitude: profileData.latitude,
      longitude: profileData.longitude,
      city: profileData.city,
      country: profileData.country,
      interests: profileData.interests,
      photos: profileData.photos,
      maxDistance: profileData.maxDistance ?? 50,
      isPremium: profileData.isPremium ?? false,
      isLocationVisible: true,
      lastActive: new Date(),
    });

    const savedProfile = await profileRepository.save(profile);
    createdProfiles.push(savedProfile);
    
    console.log(`✅ Создан профиль: ${profileData.name} (${profileData.city})`);
  }

  console.log(`👤 Создано профилей: ${createdProfiles.length}`);
  return createdProfiles;
}