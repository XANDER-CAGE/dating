import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPostgisSupport1640000001000 implements MigrationInterface {
  name = 'AddPostgisSupport1640000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Включаем PostGIS расширение
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "postgis"`);
    
    // Добавляем колонку location типа POINT (geometry)
    await queryRunner.query(`
      ALTER TABLE "profiles" 
      ADD COLUMN "location" geometry(POINT, 4326)
    `);

    // Создаем пространственный индекс для быстрого поиска
    await queryRunner.query(`
      CREATE INDEX "IDX_profiles_location_gist" 
      ON "profiles" USING GIST ("location")
    `);

    // Функция для обновления location на основе latitude и longitude
    await queryRunner.query(`
      UPDATE "profiles" 
      SET "location" = ST_SetSRID(ST_MakePoint("longitude", "latitude"), 4326)
      WHERE "latitude" IS NOT NULL AND "longitude" IS NOT NULL
    `);

    // Создаем функцию для автоматического обновления location
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_location_from_coordinates()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
          NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
        ELSE
          NEW.location = NULL;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Создаем триггер для автоматического обновления
    await queryRunner.query(`
      CREATE TRIGGER trigger_update_location
      BEFORE INSERT OR UPDATE ON "profiles"
      FOR EACH ROW
      EXECUTE FUNCTION update_location_from_coordinates();
    `);

    // Добавляем колонку lastKnownLocation для отслеживания последнего местоположения
    await queryRunner.query(`
      ALTER TABLE "profiles" 
      ADD COLUMN "lastKnownLocation" geometry(POINT, 4326)
    `);

    // Добавляем метаданные о местоположении
    await queryRunner.query(`
      ALTER TABLE "profiles"
      ADD COLUMN "locationUpdatedAt" TIMESTAMP,
      ADD COLUMN "locationAccuracy" DECIMAL(10,2),
      ADD COLUMN "city" VARCHAR(100),
      ADD COLUMN "country" VARCHAR(100),
      ADD COLUMN "isLocationVisible" BOOLEAN NOT NULL DEFAULT true
    `);

    // Создаем индексы для оптимизации
    await queryRunner.query(`CREATE INDEX "IDX_profiles_city" ON "profiles" ("city")`);
    await queryRunner.query(`CREATE INDEX "IDX_profiles_country" ON "profiles" ("country")`);
    await queryRunner.query(`CREATE INDEX "IDX_profiles_location_visible" ON "profiles" ("isLocationVisible")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Удаляем добавленные элементы
    await queryRunner.query(`DROP TRIGGER IF EXISTS trigger_update_location ON "profiles"`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_location_from_coordinates()`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_profiles_location_gist"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_profiles_city"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_profiles_country"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_profiles_location_visible"`);
    
    await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN "location"`);
    await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN "lastKnownLocation"`);
    await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN "locationUpdatedAt"`);
    await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN "locationAccuracy"`);
    await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN "city"`);
    await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN "country"`);
    await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN "isLocationVisible"`);
  }
}