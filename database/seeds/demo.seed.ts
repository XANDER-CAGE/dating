import { DataSource } from 'typeorm';
import { User } from '../../src/users/entities/user.entity';
import { Profile, Gender, InterestedIn } from '../../src/profiles/entities/profile.entity';
import { Swipe, SwipeAction } from '../../src/swipes/entities/swipe.entity';
import { Match } from '../../src/matches/entities/match.entity';
import { Message, MessageType } from '../../src/chats/entities/message.entity';
import * as bcrypt from 'bcrypt';

// Демо сценарий: история знакомства Анны и Александра
export async function runDemoSeeds(dataSource: DataSource): Promise<void> {
  console.log('🎬 Создание демо сценария...');
  
  const userRepo = dataSource.getRepository(User);
  const profileRepo = dataSource.getRepository(Profile);
  const swipeRepo = dataSource.getRepository(Swipe);
  const matchRepo = dataSource.getRepository(Match);
  const messageRepo = dataSource.getRepository(Message);

  // === СОЗДАЕМ ГЛАВНЫХ ГЕРОЕВ ===
  
  // Анна - главная героиня
  const annaUser = userRepo.create({
    email: 'anna.demo@dating-app.com',
    passwordHash: await bcrypt.hash('Demo123456', 12),
    phone: '+79991111111',
    isVerified: true,
    isActive: true,
  });
  const savedAnnaUser = await userRepo.save(annaUser);

  const annaProfile = profileRepo.create({
    userId: savedAnnaUser.id,
    name: 'Анна',
    age: 25,
    gender: Gender.FEMALE,
    interestedIn: InterestedIn.MALE,
    bio: '🎨 Дизайнер в IT компании. Люблю кофе, книги и долгие прогулки по Москве. Ищу интересного собеседника для серьезных отношений.',
    latitude: 55.7558, // Центр Москвы
    longitude: 37.6176,
    city: 'Москва',
    country: 'Россия',
    interests: ['дизайн', 'кофе', 'книги', 'путешествия', 'фотография', 'музеи'],
    photos: [
      'https://i.pravatar.cc/400?img=1',
      'https://i.pravatar.cc/400?img=11',
      'https://i.pravatar.cc/400?img=21'
    ],
    maxDistance: 25,
    isPremium: false,
    isLocationVisible: true,
    lastActive: new Date(),
  });
  await profileRepo.save(annaProfile);

  // Александр - идеальный матч
  const alexUser = userRepo.create({
    email: 'alex.demo@dating-app.com',
    passwordHash: await bcrypt.hash('Demo123456', 12),
    phone: '+79992222222',
    isVerified: true,
    isActive: true,
  });
  const savedAlexUser = await userRepo.save(alexUser);

  const alexProfile = profileRepo.create({
    userId: savedAlexUser.id,
    name: 'Александр',
    age: 28,
    gender: Gender.MALE,
    interestedIn: InterestedIn.FEMALE,
    bio: '💻 Full-stack разработчик. Создаю веб-приложения и мобильные apps. В свободное время читаю, занимаюсь спортом и изучаю новые технологии.',
    latitude: 55.7522, // Арбат, ~2км от Анны
    longitude: 37.5936,
    city: 'Москва',
    country: 'Россия',
    interests: ['программирование', 'книги', 'спорт', 'технологии', 'путешествия', 'кино'],
    photos: [
      'https://i.pravatar.cc/400?img=3',
      'https://i.pravatar.cc/400?img=13',
      'https://i.pravatar.cc/400?img=23'
    ],
    maxDistance: 30,
    isPremium: true,
    isLocationVisible: true,
    lastActive: new Date(),
  });
  await profileRepo.save(alexProfile);

  // === СОЗДАЕМ ДРУГИХ КАНДИДАТОВ ===
  
  const otherUsers = [
    {
      name: 'Дмитрий',
      age: 30,
      bio: '🏋️ Фитнес-тренер. Помогаю людям достигать своих целей.',
      lat: 55.7935, lng: 37.6703, // Сокольники, ~7км
      interests: ['спорт', 'фитнес', 'здоровье', 'мотивация'],
    },
    {
      name: 'Михаил',
      age: 26,
      bio: '🎵 Музыкант и звукорежиссер. Играю на гитаре.',
      lat: 55.7033, lng: 37.5302, // МГУ, ~15км
      interests: ['музыка', 'гитара', 'звук', 'концерты'],
    },
    {
      name: 'Сергей',
      age: 32,
      bio: '📊 Менеджер по продажам. Люблю активный отдых.',
      lat: 55.8215, lng: 37.6398, // ВДНХ, ~10км
      interests: ['продажи', 'бизнес', 'активный отдых', 'мотоциклы'],
    },
  ];

  const createdOtherUsers = [];
  for (let i = 0; i < otherUsers.length; i++) {
    const userData = otherUsers[i];
    
    const user = userRepo.create({
      email: `${userData.name.toLowerCase()}.demo${i}@dating-app.com`,
      passwordHash: await bcrypt.hash('Demo123456', 12),
      phone: `+79993333${String(i).padStart(3, '0')}`,
      isVerified: true,
      isActive: true,
    });
    const savedUser = await userRepo.save(user);

    const profile = profileRepo.create({
      userId: savedUser.id,
      name: userData.name,
      age: userData.age,
      gender: Gender.MALE,
      interestedIn: InterestedIn.FEMALE,
      bio: userData.bio,
      latitude: userData.lat,
      longitude: userData.lng,
      city: 'Москва',
      country: 'Россия',
      interests: userData.interests,
      photos: [`https://i.pravatar.cc/400?img=${i + 30}`],
      maxDistance: 25,
      isPremium: i === 0, // Первый - премиум
      isLocationVisible: true,
      lastActive: new Date(Date.now() - i * 60 * 60 * 1000), // Разное время активности
    });
    await profileRepo.save(profile);
    
    createdOtherUsers.push({ user: savedUser, profile });
  }

  // === СОЗДАЕМ ИСТОРИЮ СВАЙПОВ ===
  
  console.log('💫 Создание истории свайпов...');
  
  // Анна дислайкает первых двух, лайкает Александра
  const annaSwipes = [
    { target: createdOtherUsers[0].user, action: SwipeAction.DISLIKE },
    { target: createdOtherUsers[1].user, action: SwipeAction.DISLIKE },
    { target: savedAlexUser, action: SwipeAction.LIKE },
  ];

  for (const swipeData of annaSwipes) {
    const swipe = swipeRepo.create({
      swiperId: savedAnnaUser.id,
      swipedId: swipeData.target.id,
      action: swipeData.action,
      createdAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000), // Последние 24 часа
    });
    await swipeRepo.save(swipe);
  }

  // Александр тоже лайкает Анну (создается матч!)
  const alexSwipe = swipeRepo.create({
    swiperId: savedAlexUser.id,
    swipedId: savedAnnaUser.id,
    action: SwipeAction.LIKE,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 часов назад
  });
  await swipeRepo.save(alexSwipe);

  // === СОЗДАЕМ МАТЧ ===
  
  console.log('💝 Создание матча...');
  
  const match = matchRepo.create({
    user1Id: savedAnnaUser.id,
    user2Id: savedAlexUser.id,
    isActive: true,
    lastMessageAt: new Date(),
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
  });
  const savedMatch = await matchRepo.save(match);

  // === СОЗДАЕМ ДИАЛОГ ===
  
  console.log('💬 Создание диалога...');
  
  const messages = [
    {
      senderId: savedAlexUser.id,
      content: 'Привет, Анна! Увидел, что мы матчнулись. Очень приятно! 😊',
      timestamp: new Date(Date.now() - 11 * 60 * 60 * 1000),
    },
    {
      senderId: savedAnnaUser.id,
      content: 'Привет, Александр! Да, тоже очень рада! Посмотрела твой профиль - ты разработчик? Это интересно!',
      timestamp: new Date(Date.now() - 10.5 * 60 * 60 * 1000),
    },
    {
      senderId: savedAlexUser.id,
      content: 'Да, работаю full-stack разработчиком уже 5 лет. А ты дизайнер! Это же отлично - мы могли бы создавать проекты вместе 😄',
      timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000),
    },
    {
      senderId: savedAnnaUser.id,
      content: 'Ого, это было бы здорово! Я всегда хотела больше узнать о том, как работает бэкенд. А ты где в Москве живешь?',
      timestamp: new Date(Date.now() - 9.5 * 60 * 60 * 1000),
    },
    {
      senderId: savedAlexUser.id,
      content: 'Рядом с Арбатом. Вижу, ты в центре - мы совсем близко! Может быть, встретимся на кофе на выходных?',
      timestamp: new Date(Date.now() - 9 * 60 * 60 * 1000),
    },
    {
      senderId: savedAnnaUser.id,
      content: 'С удовольствием! Знаешь хорошие кофейни в районе Арбата? ☕',
      timestamp: new Date(Date.now() - 8.5 * 60 * 60 * 1000),
    },
    {
      senderId: savedAlexUser.id,
      content: 'Конечно! Есть отличное место - "Кофе Культ" на Никитской. Уютно и кофе просто изумительный. Как тебе суббота в 14:00?',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
    },
    {
      senderId: savedAnnaUser.id,
      content: 'Звучит идеально! Суббота в 14:00 - идеально. Буду ждать встречи! 😊',
      timestamp: new Date(Date.now() - 7.5 * 60 * 60 * 1000),
    },
  ];

  for (const msgData of messages) {
    const message = messageRepo.create({
      matchId: savedMatch.id,
      senderId: msgData.senderId,
      content: msgData.content,
      messageType: MessageType.TEXT,
      isRead: msgData.senderId === savedAnnaUser.id, // Анна прочитала все сообщения
      readAt: msgData.senderId === savedAnnaUser.id ? new Date() : null,
      createdAt: msgData.timestamp,
    });
    await messageRepo.save(message);
  }

  // Обновляем время последнего сообщения в матче
  await matchRepo.update(savedMatch.id, {
    lastMessageAt: new Date(Date.now() - 7.5 * 60 * 60 * 1000),
  });

  console.log('🎬 Демо сценарий создан успешно!');
  console.log('\n📖 История:');
  console.log('👩 Анна (anna.demo@dating-app.com) - дизайнер, 25 лет');
  console.log('👨 Александр (alex.demo@dating-app.com) - разработчик, 28 лет');
  console.log('💫 Они матчнулись и назначили встречу в кофейне!');
  console.log('💬 В их диалоге 8 сообщений');
  console.log('📍 Живут в 2км друг от друга в Москве');
  console.log('\n🔑 Пароли для входа: Demo123456');
}