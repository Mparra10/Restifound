import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  age?: number;
  sport?: string;
}

interface UserPet {
  pet_type: string;
  pet_name: string;
  level: number;
  exp: number;
  happiness: number;
}

interface Task {
  id: string;
  title: string;
  type: 'academico' | 'deportivo' | 'personal';
  completed: boolean;
}

interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  type: 'academico' | 'deportivo' | 'personal';
}

export function useUserData(user: User | null) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [pet, setPet] = useState<UserPet | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [customMoods, setCustomMoods] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserData();
    } else {
      setProfile(null);
      setPet(null);
      setTasks([]);
      setEvents([]);
      setCustomMoods([]);
      setLoading(false);
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      // Load profile
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Load pet
      const { data: petData } = await supabase
        .from('user_pets')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (petData) {
        setPet(petData);
      }

      // Load tasks
      const { data: tasksData } = await supabase
        .from('user_tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (tasksData) {
        setTasks(tasksData);
      }

      // Load events
      const { data: eventsData } = await supabase
        .from('user_events')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (eventsData) {
        setEvents(eventsData);
      }

      // Load custom moods
      const { data: moodsData } = await supabase
        .from('user_custom_moods')
        .select('mood_name')
        .eq('user_id', user.id);

      if (moodsData) {
        setCustomMoods(moodsData.map(m => m.mood_name));
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading user data:', error);
      setLoading(false);
    }
  };

  const saveProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;

    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        id: user.id,
        email: user.email!,
        ...data,
      });

    if (!error) {
      await loadUserData();
    }
    return { error };
  };

  const savePet = async (data: Partial<UserPet>) => {
    if (!user) return;

    const { error } = await supabase
      .from('user_pets')
      .upsert({
        user_id: user.id,
        ...data,
      });

    if (!error) {
      await loadUserData();
    }
    return { error };
  };

  const addTask = async (task: Omit<Task, 'id'>) => {
    if (!user) return;

    const { error } = await supabase
      .from('user_tasks')
      .insert({
        user_id: user.id,
        ...task,
      });

    if (!error) {
      await loadUserData();
    }
    return { error };
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    if (!user) return;

    const { error } = await supabase
      .from('user_tasks')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id);

    if (!error) {
      await loadUserData();
    }
    return { error };
  };

  const deleteTask = async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('user_tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (!error) {
      await loadUserData();
    }
    return { error };
  };

  const addEvent = async (event: Omit<CalendarEvent, 'id'>) => {
    if (!user) return;

    const { error } = await supabase
      .from('user_events')
      .insert({
        user_id: user.id,
        ...event,
      });

    if (!error) {
      await loadUserData();
    }
    return { error };
  };

  const deleteEvent = async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('user_events')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (!error) {
      await loadUserData();
    }
    return { error };
  };

  const addMood = async (mood: string, note?: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('user_moods')
      .insert({
        user_id: user.id,
        mood,
        note,
      });

    return { error };
  };

  const addCustomMood = async (moodName: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('user_custom_moods')
      .insert({
        user_id: user.id,
        mood_name: moodName,
      });

    if (!error) {
      await loadUserData();
    }
    return { error };
  };

  const saveHealth = async (sleep: number, heartRate: number, activity: number) => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];

    const { error } = await supabase
      .from('user_health')
      .upsert({
        user_id: user.id,
        sleep_hours: sleep,
        heart_rate: heartRate,
        activity_percent: activity,
        date: today,
      });

    return { error };
  };

  return {
    profile,
    pet,
    tasks,
    events,
    customMoods,
    loading,
    saveProfile,
    savePet,
    addTask,
    updateTask,
    deleteTask,
    addEvent,
    deleteEvent,
    addMood,
    addCustomMood,
    saveHealth,
    reload: loadUserData,
  };
}
