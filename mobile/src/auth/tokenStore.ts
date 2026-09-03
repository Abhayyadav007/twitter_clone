import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEYS = {
  accessToken: 'tc_access_token',
  refreshToken: 'tc_refresh_token',
  userId: 'tc_user_id',
  userJson: 'tc_user_json',
} as const;

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return globalThis.localStorage?.getItem(key) ?? null;
  }
  return SecureStore.getItemAsync(key);
}

async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export type StoredSession = {
  accessToken: string;
  refreshToken: string;
  userId: string;
  userJson: string;
};

export async function saveSession(session: StoredSession): Promise<void> {
  await Promise.all([
    setItem(KEYS.accessToken, session.accessToken),
    setItem(KEYS.refreshToken, session.refreshToken),
    setItem(KEYS.userId, session.userId),
    setItem(KEYS.userJson, session.userJson),
  ]);
}

export async function loadSession(): Promise<StoredSession | null> {
  const [accessToken, refreshToken, userId, userJson] = await Promise.all([
    getItem(KEYS.accessToken),
    getItem(KEYS.refreshToken),
    getItem(KEYS.userId),
    getItem(KEYS.userJson),
  ]);

  if (!accessToken || !refreshToken || !userId || !userJson) {
    return null;
  }

  return { accessToken, refreshToken, userId, userJson };
}

export async function clearSession(): Promise<void> {
  await Promise.all([
    deleteItem(KEYS.accessToken),
    deleteItem(KEYS.refreshToken),
    deleteItem(KEYS.userId),
    deleteItem(KEYS.userJson),
  ]);
}

export async function updateAccessToken(accessToken: string): Promise<void> {
  await setItem(KEYS.accessToken, accessToken);
}

export async function updateTokens(
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  await Promise.all([
    setItem(KEYS.accessToken, accessToken),
    setItem(KEYS.refreshToken, refreshToken),
  ]);
}
