import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  AppSettings,
  AuthSession,
  Report,
  Shift,
  User,
} from './types';

const KEYS = {
  users: '@test/users',
  settings: '@test/settings',
  session: '@test/session',
  shifts: '@test/shifts',
  reports: '@test/reports',
} as const;

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function getUsers(): Promise<User[]> {
  return readJson<User[]>(KEYS.users, []);
}

export async function saveUsers(users: User[]): Promise<void> {
  await writeJson(KEYS.users, users);
}

export async function getSettings(): Promise<AppSettings> {
  return readJson<AppSettings>(KEYS.settings, {
    employerEmail: null,
    employerUserId: null,
    initialized: false,
  });
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await writeJson(KEYS.settings, settings);
}

export async function getSession(): Promise<AuthSession | null> {
  return readJson<AuthSession | null>(KEYS.session, null);
}

export async function saveSession(session: AuthSession | null): Promise<void> {
  if (!session) {
    await AsyncStorage.removeItem(KEYS.session);
    return;
  }
  await writeJson(KEYS.session, session);
}

export async function getShifts(): Promise<Shift[]> {
  return readJson<Shift[]>(KEYS.shifts, []);
}

export async function saveShifts(shifts: Shift[]): Promise<void> {
  await writeJson(KEYS.shifts, shifts);
}

export async function getReports(): Promise<Report[]> {
  return readJson<Report[]>(KEYS.reports, []);
}

export async function saveReports(reports: Report[]): Promise<void> {
  await writeJson(KEYS.reports, reports);
}
