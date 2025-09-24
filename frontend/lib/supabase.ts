import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './config';

// Initialize a single supabase client for the whole app.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, // Expo doesn't use URL callbacks by default
    storage: AsyncStorage, // Persist sessions in device storage for RN/Expo
    storageKey: 'suvidhaa-auth',
  },
});
