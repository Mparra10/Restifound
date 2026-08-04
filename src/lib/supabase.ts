import { createClient } from '@supabase/supabase-js';

// Estas son credenciales de ejemplo - el usuario debe reemplazarlas con sus propias credenciales
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hwbupscndxkzyqozofsi.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3YnVwc2NuZHhrenlxb3pvZnNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNjIyODcsImV4cCI6MjA5MjYzODI4N30.lMWfiXC4vhzda2_oxkqb8EAD0ILG8clvYDqVTlJ-sHY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database Types
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  age?: number;
  sport?: string;
  created_at: string;
  updated_at: string;
}

export interface UserPet {
  id: string;
  user_id: string;
  pet_type: string;
  pet_name: string;
  level: number;
  exp: number;
  happiness: number;
  created_at: string;
  updated_at: string;
}

export interface UserTask {
  id: string;
  user_id: string;
  title: string;
  type: 'academico' | 'deportivo' | 'personal';
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserEvent {
  id: string;
  user_id: string;
  title: string;
  description: string;
  date: string;
  type: 'academico' | 'deportivo' | 'personal';
  created_at: string;
  updated_at: string;
}

export interface UserMood {
  id: string;
  user_id: string;
  mood: string;
  note?: string;
  created_at: string;
}

export interface UserHealth {
  id: string;
  user_id: string;
  sleep_hours: number;
  heart_rate: number;
  activity_percent: number;
  date: string;
  created_at: string;
}
