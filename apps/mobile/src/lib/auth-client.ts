import { Platform } from 'react-native';
import { createAuthClient } from 'better-auth/react';
import { expoClient } from '@better-auth/expo/client';
import { secureStorage } from './secure-storage';

const API_URL = String(process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:7000');
const isWeb = Platform.OS === 'web';

export const authClient = createAuthClient({
  baseURL: API_URL,
  fetchOptions: {
    credentials: 'include',
  },
  plugins: isWeb
    ? []
    : [
        expoClient({
          scheme: 'riftbound',
          storagePrefix: 'riftbound',
          storage: secureStorage,
        }),
      ],
});

export type AuthSession = typeof authClient.$Infer.Session;
