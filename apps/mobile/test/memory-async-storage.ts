import { mock } from 'bun:test';

export function createMemoryAsyncStorage() {
  const store = new Map<string, string>();

  return {
    store,
    clear: () => {
      store.clear();
    },
    install: () => {
      mock.module('@react-native-async-storage/async-storage', () => ({
        default: {
          getItem: async (key: string) => store.get(key) ?? null,
          setItem: async (key: string, value: string) => {
            store.set(key, value);
          },
          removeItem: async (key: string) => {
            store.delete(key);
          },
          multiGet: async (keys: string[]) =>
            keys.map((key) => [key, store.get(key) ?? null] as const),
          multiSet: async (pairs: [string, string][]) => {
            for (const [key, value] of pairs) store.set(key, value);
          },
          multiRemove: async (keys: string[]) => {
            for (const key of keys) store.delete(key);
          },
        },
      }));
    },
  };
}
