import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { DatabaseSeeder } from '../database/seeds';

async function runSeeds() {
  console.log('🌱 Запуск системы сидов...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  
  const seeder = new DatabaseSeeder(dataSource);

  // Парсим аргументы командной строки
  const args = process.argv.slice(2);
  const command = args[0] || 'all';
  const count = parseInt(args[1]) || 50;

  try {
    switch (command) {
      case 'all':
        await seeder.runAllSeeds();
        break;
        
      case 'demo':
        await seeder.runDemoSeeds();
        break;
        
      case 'clear':
        await seeder.clearDatabase();
        break;
        
      case 'reset':
        await seeder.clearDatabase();
        await seeder.runAllSeeds();
        break;
        
      case 'location':
        const { runLocationSeeds } = await import('../database/seeds/location.seed');
        await runLocationSeeds(dataSource, count);
        break;
        
      default:
        console.log('🤔 Доступные команды:');
        console.log('  npm run seed all      - Запустить все сиды');
        console.log('  npm run seed demo     - Только демо данные');
        console.log('  npm run seed clear    - Очистить БД');
        console.log('  npm run seed reset    - Очистить и заполнить');
        console.log('  npm run seed location [count] - Геолокационные данные');
        break;
    }
  } catch (error) {
    console.error('❌ Ошибка выполнения сидов:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

if (require.main === module) {
  runSeeds();
}