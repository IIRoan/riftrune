import { createAuthClient } from 'better-auth/react';
import { expoClient } from '@better-auth/expo/client';
import { secureStorage } from './secure-storage';

const API_URL = String(process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000');

export const authClient = createAuthClient({
  baseURL: API_URL,
  plugins: [
    expoClient({
      scheme: 'riftbound',
      storagePrefix: 'riftbound',
      storage: secureStorage,
    }),
  ],
});

export type AuthSession = typeof authClient.$Infer.Session;
