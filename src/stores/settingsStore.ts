import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserSettings } from '@/types';
import { STORE_VERSION, storageKey } from './persist';

export const DEFAULT_SETTINGS: UserSettings = {
  name: '',
  grade: '10',
  avatarColor: 'purple',
  theme: 'system',
  accent: 'indigo',
  defaultTaskView: 'list',
  weekStartsOn: 1,
  onboarded: false,
  notificationsEnabled: false,
};

interface SettingsState extends UserSettings {
  update: (patch: Partial<UserSettings>) => void;
  replace: (settings: UserSettings) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      update: (patch) => set(patch),
      replace: (settings) => set({ ...DEFAULT_SETTINGS, ...settings }),
    }),
    {
      name: storageKey('settings'),
      version: STORE_VERSION,
      migrate: (state) => ({ ...DEFAULT_SETTINGS, ...(state as Partial<UserSettings>) }),
    },
  ),
);

/** Snapshot of just the data fields (for export). */
export function pickSettings(s: SettingsState): UserSettings {
  return {
    name: s.name,
    grade: s.grade,
    avatarColor: s.avatarColor,
    theme: s.theme,
    accent: s.accent,
    defaultTaskView: s.defaultTaskView,
    weekStartsOn: s.weekStartsOn,
    onboarded: s.onboarded,
    notificationsEnabled: s.notificationsEnabled,
  };
}
