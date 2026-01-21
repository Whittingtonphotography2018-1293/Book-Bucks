import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

SplashScreen.preventAutoHideAsync();

export function useFrameworkReady() {
  useEffect(() => {
    if (Platform.OS === 'web') {
      window.frameworkReady?.();
    }

    SplashScreen.hideAsync();
  }, []);
}
