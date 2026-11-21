import type { SubjectColor } from '@/types';
import { subjectVars } from '@/utils/colors';

export type ArtKind =
  | 'medicine'
  | 'chemistry'
  | 'biology'
  | 'physics'
  | 'earth'
  | 'science'
  | 'geometry'
  | 'stats'
  | 'math'
  | 'code'
  | 'languages'
  | 'english'
  | 'history'
  | 'psychology'
  | 'music'
  | 'arts'
  | 'sports'
  | 'general'
  | 'idea'
  | 'notebook';

/**
 * Most specific subjects first: "Computer Science" → code (not science),
 * "bio med" → medicine, "biochemistry" → chemistry, "English as a Second Language" → languages.
 */
const RULES: [ArtKind, RegExp][] = [
  ['code', /computer|\bcs\b|coding|programming|software|robotic|\btech|\bai\b|\bdata\b/],
  ['sports', /\bpe\b|physical ed|\bgym\b|sport|fitness|athlet/],
  ['medicine', /medic|\bmed\b|health|nurs|anatom|physiolog|pharma|dental|clinical/],
  ['chemistry', /chem/],
  ['biology', /bio|life sci|ecolog|genetic|zoolog|botan|microb/],
  ['physics', /physics|mechanic|astro|quantum|electr/],
  ['earth', /earth|geograph|geolog|environment|climate|ocean/],
  ['science', /science|\blab\b|\bstem\b/],
  ['geometry', /geometr|\btrig/],
  ['stats', /statistic|probabilit|\becon|business|financ|accounting|marketing/],
  ['math', /math|algebra|calculus|pre-?calc|arithmetic/],
  [
    'languages',
    /language|spanish|french|german|italian|chinese|mandarin|japanese|korean|arabic|latin|\besl\b|farsi|persian/,
  ],
  ['english', /english|literature|writing|reading|journalism|creative|poetry|\bela\b/],
  ['history', /history|social stud|civics|government|politic|\blaw\b|world/],
  ['psychology', /psych|sociolog|philosoph/],
  ['music', /music|\bband\b|choir|orchestra|piano|guitar/],
  ['arts', /\bart\b|\barts\b|drawing|paint|design|theat|drama|photo/],
];

const FALLBACKS: ArtKind[] = ['general', 'idea', 'notebook'];

/** Suggested card color per subject (used as the default when creating a class). */
export const ART_COLORS: Partial<Record<ArtKind, SubjectColor>> = {
  medicine: 'rose',
  chemistry: 'cyan',
  biology: 'green',
  physics: 'purple',
  earth: 'lime',
  science: 'green',
  geometry: 'lime',
  stats: 'amber',
  math: 'blue',
  code: 'cyan',
  languages: 'rose',
  english: 'purple',
  history: 'amber',
  psychology: 'pink',
  music: 'pink',
  arts: 'pink',
  sports: 'lime',
};

/** Soft gradient + dot grid used behind a subject illustration. */
export function artBackground(color: SubjectColor) {
  const v = subjectVars(color);
  return {
    backgroundColor: v.soft,
    backgroundImage: `radial-gradient(circle at 1px 1px, color-mix(in srgb, ${v.solid} 24%, transparent) 1px, transparent 0), linear-gradient(120deg, color-mix(in srgb, ${v.solid} 12%, transparent), transparent 60%)`,
    backgroundSize: '14px 14px, 100% 100%',
  };
}

function hash(text: string): number {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

/** Choose an illustration from a class's subject + name. Unknown subjects get a varied fallback. */
export function pickArtKind(text: string): ArtKind {
  const t = text.toLowerCase();
  const hit = RULES.find(([, re]) => re.test(t))?.[0];
  return hit ?? FALLBACKS[hash(t.trim()) % FALLBACKS.length];
}

/** Suggested color for a class name/subject, or null if nothing matches. */
export function suggestColor(text: string): SubjectColor | null {
  const t = text.toLowerCase();
  const hit = RULES.find(([, re]) => re.test(t))?.[0];
  return hit ? (ART_COLORS[hit] ?? null) : null;
}
