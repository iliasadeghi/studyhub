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

const ART: Record<ArtKind, (p: ArtProps) => ReactElement> = {
  math: MathArt,
  science: ScienceArt,
  english: EnglishArt,
  history: HistoryArt,
  languages: LanguagesArt,
  code: CodeArt,
  arts: ArtsArt,
  sports: SportsArt,
  general: GeneralArt,
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
