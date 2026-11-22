import { useEffect } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSchoolStore } from '@/stores/schoolStore';
import { useMediaQuery } from './useMediaQuery';

/** Resolved dark/light based on setting + system preference. */
export function useResolvedTheme(): 'light' | 'dark' {
  const theme = useSettingsStore((s) => s.theme);
  const systemDark = useMediaQuery('(prefers-color-scheme: dark)');
  if (theme === 'system') return systemDark ? 'dark' : 'light';
  return theme;
}

/** The accent in use: your own pick, otherwise the school's color. */
export function useAccent() {
  const own = useSettingsStore((s) => s.accent);
  const chosen = useSettingsStore((s) => s.accentChosen);
  const school = useSchoolStore((s) => (s.loaded ? s.settings.accent : s.publicInfo?.accent));
  return { accent: chosen ? own : (school ?? own), chosen, school: school ?? null };
}

/** Keeps the <html> element's class and accent attribute in sync with settings. */
export function useApplyTheme(): void {
  const resolved = useResolvedTheme();
  const { accent } = useAccent();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', resolved === 'dark');
    const meta = document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute('content', resolved === 'dark' ? '#0E0F13' : '#F7F7FB');
  }, [resolved]);

  useEffect(() => {
    const root = document.documentElement;
    if (accent === 'indigo') delete root.dataset.accent;
    else root.dataset.accent = accent;
  }, [accent]);
}
