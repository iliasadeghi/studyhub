import type { AccentColor, SubjectColor } from '@/types';

export const SUBJECT_COLORS: SubjectColor[] = [
  'blue',
  'green',
  'purple',
  'amber',
  'rose',
  'pink',
  'cyan',
  'lime',
];

export const SUBJECT_COLOR_LABELS: Record<SubjectColor, string> = {
  blue: 'Blue',
  green: 'Green',
  purple: 'Purple',
  amber: 'Amber',
  rose: 'Rose',
  pink: 'Pink',
  cyan: 'Cyan',
  lime: 'Lime',
};

export const ACCENTS: { id: AccentColor; label: string; swatch: string }[] = [
  { id: 'indigo', label: 'Indigo', swatch: '#5B5BD6' },
  { id: 'teal', label: 'Teal', swatch: '#0E8577' },
  { id: 'rose', label: 'Rose', swatch: '#D93F4C' },
  { id: 'amber', label: 'Amber', swatch: '#B45309' },
  { id: 'sky', label: 'Sky', swatch: '#0277B6' },
];

/** CSS custom property references for a subject color. */
export function subjectVars(color: SubjectColor) {
  return {
    solid: `var(--c-${color})`,
    text: `var(--c-${color}-text)`,
    soft: `color-mix(in srgb, var(--c-${color}) 14%, transparent)`,
  };
}
