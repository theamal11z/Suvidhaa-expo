import Constants from 'expo-constants';

// Read public runtime config from environment variables
// Expo automatically loads EXPO_PUBLIC_ prefixed variables
export const SUPABASE_URL: string = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY: string = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
export const CLOUDINARY_CLOUD_NAME: string = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || '';

// Backend URL (usually same as Supabase URL)
export const BACKEND_URL: string = SUPABASE_URL;

// Validation with better error messages
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  const missing = [];
  if (!SUPABASE_URL) missing.push('EXPO_PUBLIC_SUPABASE_URL');
  if (!SUPABASE_ANON_KEY) missing.push('EXPO_PUBLIC_SUPABASE_ANON_KEY');
  if (!CLOUDINARY_CLOUD_NAME) missing.push('EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME');
  
  console.error('[config] Missing environment variables:', missing.join(', '));
  console.error('Make sure your .env file exists and contains the required EXPO_PUBLIC_ variables.');
  
  // Don't throw in production to avoid crashes, just log
  if (__DEV__) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
