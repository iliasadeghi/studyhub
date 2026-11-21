import type { ReactElement } from 'react';
import type { ClassItem } from '@/types';
import { cn } from '@/utils/cn';
import { subjectVars } from '@/utils/colors';
import { pickArtKind, type ArtKind } from './pickArt';
import {
  CodeArt,
  EnglishArt,
  HistoryArt,
  LanguagesArt,
  MathArt,
  ScienceArt,
  type ArtProps,
} from './illustrations';
import { ArtsArt, GeneralArt, SportsArt } from './moreIllustrations';
import { BiologyArt, ChemistryArt, MedicineArt, PhysicsArt } from './scienceIllustrations';
import {
  EarthArt,
  GeometryArt,
  IdeaArt,
  MusicArt,
  NotebookArt,
  PsychologyArt,
  StatsArt,
} from './otherIllustrations';

const ART: Record<ArtKind, (p: ArtProps) => ReactElement> = {
  medicine: MedicineArt,
  chemistry: ChemistryArt,
  biology: BiologyArt,
  physics: PhysicsArt,
  earth: EarthArt,
  science: ScienceArt,
  geometry: GeometryArt,
  stats: StatsArt,
  math: MathArt,
  code: CodeArt,
  languages: LanguagesArt,
  english: EnglishArt,
  history: HistoryArt,
  psychology: PsychologyArt,
  music: MusicArt,
  arts: ArtsArt,
  sports: SportsArt,
  general: GeneralArt,
  idea: IdeaArt,
  notebook: NotebookArt,
};

/** Decorative illustration that matches a class's subject and color. */
export function SubjectArt({
  cls,
  className,
}: {
  cls: Pick<ClassItem, 'name' | 'subject' | 'color'>;
  className?: string;
}) {
  const v = subjectVars(cls.color);
  const Art = ART[pickArtKind(`${cls.subject} ${cls.name}`)];
  return (
    <svg
      viewBox="0 0 200 112"
      preserveAspectRatio="xMaxYMid meet"
      aria-hidden
      focusable="false"
      className={cn('pointer-events-none select-none', className)}
      fontFamily="'Plus Jakarta Sans', system-ui, sans-serif"
    >
      <Art s={v.solid} t={v.text} />
    </svg>
  );
}
