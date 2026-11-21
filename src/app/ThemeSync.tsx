import { useApplyTheme } from '@/hooks/useTheme';

/** Renders nothing; keeps <html> theme classes in sync with settings. */
export function ThemeSync() {
  useApplyTheme();
  return null;
}
