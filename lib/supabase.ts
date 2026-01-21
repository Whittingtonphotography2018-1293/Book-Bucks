import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

function getEnvVar(key: string, fallbackKey?: string): string {
  const envValue = process.env[key];
  if (envValue) return envValue;

  const constantsValue = Constants.expoConfig?.extra?.[fallbackKey || key];
  if (constantsValue) return constantsValue;

  console.error(`Missing environment variable: ${key}`);
  throw new Error(`Missing required environment variable: ${key}. Please check your app configuration.`);
}

const supabaseUrl = getEnvVar('EXPO_PUBLIC_SUPABASE_URL', 'supabaseUrl');
const supabaseAnonKey = getEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY', 'supabaseAnonKey');

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

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    ...(Platform.OS !== 'web' ? { storage: ExpoSecureStoreAdapter } : {}),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
