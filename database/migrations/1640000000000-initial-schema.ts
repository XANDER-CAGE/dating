import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1640000000000 implements MigrationInterface {
  name = 'InitialSchema1640000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" VARCHAR NOT NULL,
        "phone" VARCHAR,
        "passwordHash" VARCHAR NOT NULL,
        "isVerified" BOOLEAN NOT NULL DEFAULT false,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_user_email" UNIQUE ("email"),
        CONSTRAINT "UQ_user_phone" UNIQUE ("phone"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    // Profiles table
    await queryRunner.query(`
      CREATE TABLE "profiles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "name" VARCHAR NOT NULL,
        "bio" TEXT,
        "age" INTEGER NOT NULL,
        "gender" VARCHAR NOT NULL,
        "interestedIn" VARCHAR NOT NULL,
        "latitude" DECIMAL(10,8),
        "longitude" DECIMAL(11,8),
        "maxDistance" INTEGER NOT NULL DEFAULT 50,
        "photos" JSONB NOT NULL DEFAULT '[]',
        "interests" JSONB NOT NULL DEFAULT '[]',
        "isPremium" BOOLEAN NOT NULL DEFAULT false,
        "lastActive" TIMESTAMP NOT NULL DEFAULT now(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_profiles" PRIMARY KEY ("id"),
        CONSTRAINT "FK_profiles_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Swipes table
    await queryRunner.query(`
      CREATE TABLE "swipes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "swiperId" uuid NOT NULL,
        "swipedId" uuid NOT NULL,
        "action" VARCHAR NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_swipes" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_swipes_swiper_swiped" UNIQUE ("swiperId", "swipedId"),
        CONSTRAINT "FK_swipes_swiperId" FOREIGN KEY ("swiperId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_swipes_swipedId" FOREIGN KEY ("swipedId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Matches table
    await queryRunner.query(`
      CREATE TABLE "matches" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user1Id" uuid NOT NULL,
        "user2Id" uuid NOT NULL,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "lastMessageAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_matches" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_matches_users" UNIQUE ("user1Id", "user2Id"),
        CONSTRAINT "FK_matches_user1Id" FOREIGN KEY ("user1Id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_matches_user2Id" FOREIGN KEY ("user2Id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Messages table
    await queryRunner.query(`
      CREATE TABLE "messages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "matchId" uuid NOT NULL,
        "senderId" uuid NOT NULL,
        "content" TEXT NOT NULL,
        "messageType" VARCHAR NOT NULL DEFAULT 'text',
        "isRead" BOOLEAN NOT NULL DEFAULT false,
        "readAt" TIMESTAMP,
        "isEdited" BOOLEAN NOT NULL DEFAULT false,
        "editedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_messages" PRIMARY KEY ("id"),
        CONSTRAINT "FK_messages_matchId" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_messages_senderId" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Indexes
    await queryRunner.query(`CREATE INDEX "IDX_profiles_userId" ON "profiles" ("userId")`);
    await queryRunner.query(`CREATE INDEX "IDX_profiles_location" ON "profiles" ("latitude", "longitude")`);
    await queryRunner.query(`CREATE INDEX "IDX_swipes_swiperId_createdAt" ON "swipes" ("swiperId", "createdAt")`);
    await queryRunner.query(`CREATE INDEX "IDX_swipes_swipedId_action" ON "swipes" ("swipedId", "action")`);
    await queryRunner.query(`CREATE INDEX "IDX_matches_user1Id_isActive" ON "matches" ("user1Id", "isActive")`);
    await queryRunner.query(`CREATE INDEX "IDX_matches_user2Id_isActive" ON "matches" ("user2Id", "isActive")`);
    await queryRunner.query(`CREATE INDEX "IDX_messages_matchId_createdAt" ON "messages" ("matchId", "createdAt")`);
    await queryRunner.query(`CREATE INDEX "IDX_messages_senderId_createdAt" ON "messages" ("senderId", "createdAt")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "messages"`);
    await queryRunner.query(`DROP TABLE "matches"`);
    await queryRunner.query(`DROP TABLE "swipes"`);
    await queryRunner.query(`DROP TABLE "profiles"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}