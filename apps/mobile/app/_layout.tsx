import '../global.css';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavThemeProvider,
} from '@react-navigation/native';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Platform, StatusBar } from 'react-native';
import { AppBootstrap } from '@/components/AppBootstrap';
import { TetraProvider } from '@/components/TetraProvider';
import { AppLoadingScreen } from '@/components/ui/app-loader';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { useAppBootstrap } from '@/hooks/useAppBootstrap';
import { useAppFonts } from '@/hooks/useAppFonts';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { createQueryClient } from '@/src/api/queryClient';
import {
  createQueryPersister,
  QUERY_PERSIST_MAX_AGE_MS,
  shouldPersistQuery,
} from '@/src/api/queryPersist';
import { hydrateSecureStorage } from '@/src/lib/secure-storage';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

const queryClient = createQueryClient();
const queryPersister = createQueryPersister();

function RootNav() {
  const { actualTheme } = useTheme();
  const fontsLoaded = useAppFonts();
  const reduceMotion = useReduceMotion();
  const { isLocalReady } = useAppBootstrap();
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

  const bootReady = fontsLoaded && storageReady && isLocalReady;

  useEffect(() => {
    if (bootReady) {
      void SplashScreen.hideAsync();
    }
  }, [bootReady]);

  if (!bootReady) {
    return <AppLoadingScreen size="lg" />;
  }

  return (
    <NavThemeProvider value={actualTheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar translucent backgroundColor="transparent" />
      <Stack
        screenOptions={{
          animation: reduceMotion ? 'fade' : 'default',
          gestureEnabled: true,
          fullScreenGestureEnabled: Platform.OS === 'ios',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'none' }} />
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
        <Stack.Screen
          name="collection/invite/[token]"
          options={{
            title: 'Join collection',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="invite/[token]"
          options={{
            title: 'Open invite',
            headerShown: false,
          }}
        />
      </Stack>
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: queryPersister,
          maxAge: QUERY_PERSIST_MAX_AGE_MS,
          dehydrateOptions: {
            shouldDehydrateQuery: shouldPersistQuery,
          },
        }}
      >
        <AppBootstrap>
          <ThemeProvider>
            <TetraProvider>
              <RootNav />
            </TetraProvider>
          </ThemeProvider>
        </AppBootstrap>
      </PersistQueryClientProvider>
    </GestureHandlerRootView>
  );
}
