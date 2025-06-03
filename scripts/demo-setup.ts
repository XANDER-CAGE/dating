import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { DatabaseSeeder } from '../database/seeds';

async function setupDemo() {
  console.log('🎬 Быстрая настройка демо...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  
  const seeder = new DatabaseSeeder(dataSource);

  try {
    // Очищаем и создаем демо
    await seeder.clearDatabase();
    await seeder.runDemoSeeds();
    
    // Добавляем немного геолокационных данных
    const { runLocationSeeds } = await import('../database/seeds/location.seed');
    await runLocationSeeds(dataSource, 20);
    
    console.log('\n🎉 Демо готово!');
    console.log('👤 Войдите как:');
    console.log('   📧 anna.demo@dating-app.com');
    console.log('   🔑 Demo123456');
    console.log('\n🧪 Или протестируйте API:');
    console.log('   curl -X POST http://localhost:3000/auth/login \\');
    console.log('     -d \'{"email":"anna.demo@dating-app.com","password":"Demo123456"}\'');
    
  } catch (error) {
    console.error('❌ Ошибка настройки демо:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

if (require.main === module) {
  setupDemo();
}