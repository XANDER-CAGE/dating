import { DataSource } from 'typeorm';
import { User } from '../../src/users/entities/user.entity';
import * as bcrypt from 'bcrypt';

interface SeedUser {
  email: string;
  password: string;
  phone?: string;
  isVerified?: boolean;
}

const SEED_USERS: SeedUser[] = [
  {
    email: 'admin@dating-app.com',
    password: 'Admin123456',
    phone: '+79991234567',
    isVerified: true,
  },
  {
    email: 'anna.moscow@test.com',
    password: 'Test123456',
    phone: '+79991234568',
    isVerified: true,
  },
  {
    email: 'alex.moscow@test.com', 
    password: 'Test123456',
    phone: '+79991234569',
    isVerified: true,
  },
  {
    email: 'maria.spb@test.com',
    password: 'Test123456',
    phone: '+79991234570',
    isVerified: true,
  },
];

export async function runUserSeeds(dataSource: DataSource): Promise<User[]> {
  console.log('👥 Создание пользователей...');
  
  const userRepository = dataSource.getRepository(User);
  const createdUsers: User[] = [];

  for (const userData of SEED_USERS) {
    // Проверяем, существует ли пользователь
    const existingUser = await userRepository.findOne({
      where: { email: userData.email }
    });

    if (existingUser) {
      console.log(`⏭️  Пользователь ${userData.email} уже существует`);
      createdUsers.push(existingUser);
      continue;
    }

    // Хешируем пароль
    const passwordHash = await bcrypt.hash(userData.password, 12);

    // Создаем пользователя
    const user = userRepository.create({
      email: userData.email,
      phone: userData.phone,
      passwordHash,
      isVerified: userData.isVerified ?? false,
      isActive: true,
    });

    const savedUser = await userRepository.save(user);
    createdUsers.push(savedUser);
    
    console.log(`✅ Создан пользователь: ${userData.email}`);
  }

  console.log(`👥 Создано пользователей: ${createdUsers.length}`);
  return createdUsers;
}