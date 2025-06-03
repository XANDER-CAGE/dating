import { DataSource } from 'typeorm';
import { runUserSeeds } from './users.seed';
import { runProfileSeeds } from './profiles.seed';
import { runLocationSeeds } from './location.seed';
import { runDemoSeeds } from './demo.seed';

export class DatabaseSeeder {
  constructor(private dataSource: DataSource) {}

  async runAllSeeds() {
    console.log('🌱 Запуск всех сидов...');
    
    try {
      // Порядок важен! Сначала пользователи, потом профили
      await runUserSeeds(this.dataSource);
      await runProfileSeeds(this.dataSource); 
      await runLocationSeeds(this.dataSource);
      
      console.log('✅ Все сиды выполнены успешно!');
    } catch (error) {
      console.error('❌ Ошибка выполнения сидов:', error);
      throw error;
    }
  }

  async runDemoSeeds() {
    console.log('🎬 Запуск демо сидов...');
    await runDemoSeeds(this.dataSource);
  }

  async clearDatabase() {
    console.log('🧹 Очистка базы данных...');
    
    // Порядок удаления обратный созданию
    await this.dataSource.query('TRUNCATE TABLE messages CASCADE');
    await this.dataSource.query('TRUNCATE TABLE matches CASCADE');
    await this.dataSource.query('TRUNCATE TABLE swipes CASCADE');
    await this.dataSource.query('TRUNCATE TABLE profiles CASCADE');
    await this.dataSource.query('TRUNCATE TABLE users CASCADE');
    
    console.log('✅ База данных очищена');
  }
}