import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

function getEnvVar(key: string, fallbackKey?: string): string {
  try {
    const envValue = process.env[key];
    if (envValue) return envValue;

    const constantsValue = Constants.expoConfig?.extra?.[fallbackKey || key];
    if (constantsValue) return constantsValue;

    console.error(`Missing environment variable: ${key}`);
    throw new Error(`Missing required environment variable: ${key}. Please check your app configuration.`);
  } catch (error) {
    console.error('Error getting environment variable:', error);
    throw error;
  }
}

const supabaseUrl = getEnvVar('EXPO_PUBLIC_SUPABASE_URL', 'supabaseUrl');
const supabaseAnonKey = getEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY', 'supabaseAnonKey');

const ExpoSecureStoreAdapter = {
  getItem: async (key: string) => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('SecureStore getItem error:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('SecureStore setItem error:', error);
    }
  },
  removeItem: async (key: string) => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('SecureStore removeItem error:', error);
    }
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
