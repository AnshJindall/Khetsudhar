// utils/supabase.ts

import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import 'react-native-url-polyfill/auto';
// Note: We use process.env to access variables defined in .env
// We must use '|| ""' as the environment variables might be undefined in some contexts.

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';


// --- Custom Secure Store Adapter for Expo ---
// This tells Supabase to use ExpoSecureStore for saving the user's session token.
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    SecureStore.deleteItemAsync(key);
  },
};

// --- Initialize Supabase Client ---
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Pass the custom adapter for secure storage
    storage: ExpoSecureStoreAdapter as any, 
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});