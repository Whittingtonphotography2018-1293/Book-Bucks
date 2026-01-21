import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

SplashScreen.preventAutoHideAsync().catch((error) => {
  console.warn('Failed to prevent auto hide splash screen:', error);
});

export function useFrameworkReady() {
  useEffect(() => {
    const hideSplash = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 100));

        if (Platform.OS === 'web') {
          window.frameworkReady?.();
        }

        await SplashScreen.hideAsync();
      } catch (error) {
        console.error('Error hiding splash screen:', error);
      }
    };

    hideSplash();
  }, []);
}
