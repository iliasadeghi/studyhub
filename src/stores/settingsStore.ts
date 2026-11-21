import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserSettings } from '@/types';
import { STORE_VERSION, storageKey } from './persist';

/** Per-device preferences. Profile data (name, grade, avatar) lives in the database. */
export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'system',
  accent: 'indigo',
  defaultTaskView: 'list',
  weekStartsOn: 1,
  notificationsEnabled: false,
};

interface SettingsState extends UserSettings {
  update: (patch: Partial<UserSettings>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      update: (patch) => set(patch),
    }),
    {
      name: storageKey('settings'),
      version: STORE_VERSION + 1,
      // v1 also stored profile fields and sample-data flags; keep only preferences.
      migrate: (state) => {
        const s = (state ?? {}) as Partial<UserSettings>;
        return {
          theme: s.theme ?? DEFAULT_SETTINGS.theme,
          accent: s.accent ?? DEFAULT_SETTINGS.accent,
          defaultTaskView: s.defaultTaskView ?? DEFAULT_SETTINGS.defaultTaskView,
          weekStartsOn: s.weekStartsOn ?? DEFAULT_SETTINGS.weekStartsOn,
          notificationsEnabled: s.notificationsEnabled ?? DEFAULT_SETTINGS.notificationsEnabled,
        };
      },
    },
  ),
);

export function pickSettings(s: UserSettings): UserSettings {
  return {
    theme: s.theme,
    accent: s.accent,
    defaultTaskView: s.defaultTaskView,
    weekStartsOn: s.weekStartsOn,
    notificationsEnabled: s.notificationsEnabled,
  };
}
