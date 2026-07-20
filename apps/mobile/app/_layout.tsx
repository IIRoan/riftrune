import '../global.css';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavThemeProvider,
} from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { CatalogBootstrap } from '@/components/CatalogBootstrap';
import { TetraProvider } from '@/components/TetraProvider';
import { AppLoadingScreen } from '@/components/ui/app-loader';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { useAppFonts } from '@/hooks/useAppFonts';
import { createQueryClient } from '@/src/api/queryClient';
import { hydrateSecureStorage } from '@/src/lib/secure-storage';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

const queryClient = createQueryClient();

function RootNav() {
  const { actualTheme } = useTheme();
  const fontsLoaded = useAppFonts();
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        await hydrateSecureStorage();
      } finally {
        if (mounted) {
          setStorageReady(true);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (fontsLoaded && storageReady) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, storageReady]);

  if (!storageReady || !fontsLoaded) {
    return <AppLoadingScreen size="lg" />;
  }

  return (
    <NavThemeProvider value={actualTheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar translucent backgroundColor="transparent" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="loading"
          options={{
            title: 'Rift Channel',
            headerShown: true,
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="card/[variantNumber]"
          options={{
            headerShown: false,
            presentation: 'transparentModal',
            animation: 'fade',
            contentStyle: { backgroundColor: 'transparent' },
          }}
        />
      </Stack>
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <CatalogBootstrap />
        <ThemeProvider>
          <TetraProvider>
            <RootNav />
          </TetraProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
