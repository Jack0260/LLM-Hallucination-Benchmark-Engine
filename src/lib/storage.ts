import type { AppSettings, ThemeMode } from '@/types';

const STORAGE_PREFIX = 'phbe_';

const KEYS = {
  tasks: `${STORAGE_PREFIX}tasks`,
  models: `${STORAGE_PREFIX}models`,
  noiseProfiles: `${STORAGE_PREFIX}noise_profiles`,
  runs: `${STORAGE_PREFIX}runs`,
  settings: `${STORAGE_PREFIX}settings`,
};

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export const storage = {
  getTasks: <T>(fallback: T): T => safeGet(KEYS.tasks, fallback),
  setTasks: <T>(value: T): boolean => safeSet(KEYS.tasks, value),

  getModels: <T>(fallback: T): T => safeGet(KEYS.models, fallback),
  setModels: <T>(value: T): boolean => safeSet(KEYS.models, value),

  getNoiseProfiles: <T>(fallback: T): T => safeGet(KEYS.noiseProfiles, fallback),
  setNoiseProfiles: <T>(value: T): boolean => safeSet(KEYS.noiseProfiles, value),

  getRuns: <T>(fallback: T): T => safeGet(KEYS.runs, fallback),
  setRuns: <T>(value: T): boolean => safeSet(KEYS.runs, value),

  getSettings: (fallback: AppSettings): AppSettings => safeGet(KEYS.settings, fallback),
  setSettings: (settings: AppSettings): boolean => safeSet(KEYS.settings, settings),

  getTheme: (): ThemeMode => {
    const settings = safeGet<AppSettings | null>(KEYS.settings, null);
    return settings?.theme ?? 'system';
  },
};

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
