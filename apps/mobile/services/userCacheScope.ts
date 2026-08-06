import AsyncStorage from '@react-native-async-storage/async-storage';

/** Tracks which account the on-device user list caches belong to. */
const LAST_USER_ID_KEY = 'riftbound_last_user_id';

export async function readLastCachedUserId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(LAST_USER_ID_KEY);
  } catch {
    return null;
  }
}

export async function writeLastCachedUserId(userId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_USER_ID_KEY, userId);
  } catch {
    // Best-effort; bootstrap still network-fetches on mismatch.
  }
}

export async function clearLastCachedUserId(): Promise<void> {
  try {
    await AsyncStorage.removeItem(LAST_USER_ID_KEY);
  } catch {
    // Ignore.
  }
}
