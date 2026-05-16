import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AuthSession } from '../../types/auth';

const AUTH_SESSION_KEY = '@phantoms/auth-session';

export async function persistSession(session: AuthSession) {
  await AsyncStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
}

export async function loadStoredSession(): Promise<AuthSession | null> {
  const rawSession = await AsyncStorage.getItem(AUTH_SESSION_KEY);

  if (!rawSession) {
    return null;
  }

  return JSON.parse(rawSession) as AuthSession;
}

export async function clearStoredSession() {
  await AsyncStorage.removeItem(AUTH_SESSION_KEY);
}
