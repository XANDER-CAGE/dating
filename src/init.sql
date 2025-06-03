-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    "passwordHash" VARCHAR(255) NOT NULL,
    "isVerified" BOOLEAN DEFAULT FALSE,
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    bio TEXT,
    age INTEGER NOT NULL CHECK (age >= 18 AND age <= 100),
    gender VARCHAR(20) NOT NULL,
    "interestedIn" VARCHAR(20) NOT NULL,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    "maxDistance" INTEGER DEFAULT 50,
    photos JSONB DEFAULT '[]',
    interests JSONB DEFAULT '[]',
    "isPremium" BOOLEAN DEFAULT FALSE,
    "lastActive" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create swipes table
CREATE TABLE IF NOT EXISTS swipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "swiperId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "swipedId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(20) NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("swiperId", "swipedId")
);

-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user1Id" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "user2Id" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "isActive" BOOLEAN DEFAULT TRUE,
    "lastMessageAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("user1Id", "user2Id")
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "matchId" UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    "senderId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    "messageType" VARCHAR(20) DEFAULT 'text',
    "isRead" BOOLEAN DEFAULT FALSE,
    "readAt" TIMESTAMP,
    "isEdited" BOOLEAN DEFAULT FALSE,
    "editedAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles("userId");
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_swipes_swiper ON swipes("swiperId", "createdAt");
CREATE INDEX IF NOT EXISTS idx_swipes_swiped ON swipes("swipedId", action);
CREATE INDEX IF NOT EXISTS idx_matches_user1 ON matches("user1Id", "isActive");
CREATE INDEX IF NOT EXISTS idx_matches_user2 ON matches("user2Id", "isActive");
CREATE INDEX IF NOT EXISTS idx_messages_match ON messages("matchId", "createdAt");
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages("senderId", "createdAt");