-- Restifound Database Schema
-- Ejecuta este script en tu proyecto de Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  age INTEGER,
  sport TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Pets Table
CREATE TABLE IF NOT EXISTS user_pets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pet_type TEXT NOT NULL,
  pet_name TEXT NOT NULL,
  level INTEGER DEFAULT 1,
  exp INTEGER DEFAULT 0,
  happiness INTEGER DEFAULT 75,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- User Tasks Table
CREATE TABLE IF NOT EXISTS user_tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('academico', 'deportivo', 'personal')),
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Events Table
CREATE TABLE IF NOT EXISTS user_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('academico', 'deportivo', 'personal')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Moods Table
CREATE TABLE IF NOT EXISTS user_moods (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  mood TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Health Table
CREATE TABLE IF NOT EXISTS user_health (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sleep_hours DECIMAL(3,1) NOT NULL,
  heart_rate INTEGER NOT NULL,
  activity_percent INTEGER NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Custom Moods Table
CREATE TABLE IF NOT EXISTS user_custom_moods (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  mood_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, mood_name)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_tasks_user_id ON user_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_events_user_id ON user_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_events_date ON user_events(date);
CREATE INDEX IF NOT EXISTS idx_user_moods_user_id ON user_moods(user_id);
CREATE INDEX IF NOT EXISTS idx_user_moods_created_at ON user_moods(created_at);
CREATE INDEX IF NOT EXISTS idx_user_health_user_id ON user_health(user_id);
CREATE INDEX IF NOT EXISTS idx_user_health_date ON user_health(date);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_moods ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_custom_moods ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for user_pets
CREATE POLICY "Users can view own pet" ON user_pets
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own pet" ON user_pets
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pet" ON user_pets
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own pet" ON user_pets
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user_tasks
CREATE POLICY "Users can view own tasks" ON user_tasks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own tasks" ON user_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON user_tasks
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON user_tasks
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user_events
CREATE POLICY "Users can view own events" ON user_events
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own events" ON user_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own events" ON user_events
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own events" ON user_events
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user_moods
CREATE POLICY "Users can view own moods" ON user_moods
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own moods" ON user_moods
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_health
CREATE POLICY "Users can view own health" ON user_health
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own health" ON user_health
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own health" ON user_health
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for user_custom_moods
CREATE POLICY "Users can view own custom moods" ON user_custom_moods
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own custom moods" ON user_custom_moods
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own custom moods" ON user_custom_moods
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_pets_updated_at BEFORE UPDATE ON user_pets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_tasks_updated_at BEFORE UPDATE ON user_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_events_updated_at BEFORE UPDATE ON user_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
