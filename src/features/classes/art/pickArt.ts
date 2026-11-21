import type { SubjectColor } from '@/types';
import { subjectVars } from '@/utils/colors';

export type ArtKind =
  'math' | 'science' | 'english' | 'history' | 'languages' | 'code' | 'arts' | 'sports' | 'general';

const RULES: [ArtKind, RegExp][] = [
  ['code', /computer|\bcs\b|coding|programming|software|robotics|tech/],
  ['math', /math|algebra|geometry|calculus|statistic|trig|pre-?calc/],
  ['science', /science|bio|chem|physics|earth|environment|anatomy|lab/],
  ['languages', /language|spanish|french|german|italian|chinese|mandarin|japanese|latin|esl/],
  ['english', /english|literature|writing|reading|journalism|creative|ela\b/],
  ['history', /history|social|civics|government|economics|geography|world/],
  ['arts', /\bart\b|arts|music|drawing|design|theat|band|choir|photo/],
  ['sports', /\bpe\b|physical|gym|sport|health|fitness/],
];

/** Soft gradient + dot grid used behind a subject illustration. */
export function artBackground(color: SubjectColor) {
  const v = subjectVars(color);
  return {
    backgroundColor: v.soft,
    backgroundImage: `radial-gradient(circle at 1px 1px, color-mix(in srgb, ${v.solid} 24%, transparent) 1px, transparent 0), linear-gradient(120deg, color-mix(in srgb, ${v.solid} 12%, transparent), transparent 60%)`,
    backgroundSize: '14px 14px, 100% 100%',
  };
}

/** Choose an illustration from a class's subject + name. */
export function pickArtKind(text: string): ArtKind {
  const t = text.toLowerCase();
  return RULES.find(([, re]) => re.test(t))?.[0] ?? 'general';
}
