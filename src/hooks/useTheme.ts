import { useEffect } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { useMediaQuery } from './useMediaQuery';

/** Resolved dark/light based on setting + system preference. */
export function useResolvedTheme(): 'light' | 'dark' {
  const theme = useSettingsStore((s) => s.theme);
  const systemDark = useMediaQuery('(prefers-color-scheme: dark)');
  if (theme === 'system') return systemDark ? 'dark' : 'light';
  return theme;
}

/** Keeps the <html> element's class and accent attribute in sync with settings. */
export function useApplyTheme(): void {
  const resolved = useResolvedTheme();
  const accent = useSettingsStore((s) => s.accent);

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
