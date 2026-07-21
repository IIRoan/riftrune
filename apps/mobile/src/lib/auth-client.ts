import { Platform } from 'react-native';
import { createAuthClient } from 'better-auth/react';
import { expoClient } from '@better-auth/expo/client';
import { fetchWithApiWake } from '@/lib/api-fetch';
import { getApiUrl } from '@/lib/api-url';
import { secureStorage } from './secure-storage';

const API_URL = getApiUrl();
const isWeb = Platform.OS === 'web';

export const authClient = createAuthClient({
  baseURL: API_URL,
  fetchOptions: {
    credentials: 'include',
    customFetchImpl: fetchWithApiWake,
  },
  plugins: isWeb
    ? []
    : [
        expoClient({
          scheme: 'riftrune',
          storagePrefix: 'riftrune',
          storage: secureStorage,
        }),
      ],
});

export type AuthSession = typeof authClient.$Infer.Session;
