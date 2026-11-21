import type { ArtProps } from './illustrations';

const PAPER = 'var(--surface)';

export function ArtsArt({ s, t }: ArtProps) {
  const dots: [number, number, string][] = [
    [122, 44, 'var(--c-rose)'],
    [142, 34, 'var(--c-amber)'],
    [164, 38, 'var(--c-green)'],
    [176, 58, 'var(--c-blue)'],
  ];
  return (
    <>
      <circle cx="150" cy="58" r="50" fill={s} opacity="0.16" />
      <path
        d="M150 18 C186 18 200 44 194 64 C190 78 176 76 168 74 C158 72 156 84 160 92 C164 102 150 104 138 100 C110 92 100 66 108 46 C116 28 132 18 150 18 Z"
        fill={PAPER}
        stroke={s}
        strokeWidth="2.5"
      />
      {dots.map(([x, y, c]) => (
        <circle key={x} cx={x} cy={y} r="7" fill={c} />
      ))}
      <circle cx="132" cy="76" r="8" fill={PAPER} stroke={s} strokeWidth="2" />
      <path d="M70 100 L118 52" stroke={t} strokeWidth="5" strokeLinecap="round" />
      <path d="M118 52 L128 42 Q134 40 130 48 L122 56 Z" fill={s} />
    </>
  );
}

export function SportsArt({ s, t }: ArtProps) {
  return (
    <>
      <circle cx="150" cy="58" r="50" fill={s} opacity="0.16" />
      <g transform="translate(146 62)">
        <circle r="34" fill={s} />
        <path d="M-34 0 H34 M0 -34 V34" stroke={PAPER} strokeWidth="2.5" opacity="0.8" />
        <path
          d="M-24 -24 Q0 0 -24 24 M24 -24 Q0 0 24 24"
          fill="none"
          stroke={PAPER}
          strokeWidth="2.5"
          opacity="0.8"
        />
      </g>
      <g transform="translate(88 74)">
        <circle r="18" fill={PAPER} stroke={s} strokeWidth="2.5" />
        <rect x="-4" y="-25" width="8" height="5" rx="1.5" fill={s} />
        <path d="M0 0 V-11 M0 0 L7 5" stroke={t} strokeWidth="2.5" strokeLinecap="round" />
      </g>
    </>
  );
}

export function GeneralArt({ s, t }: ArtProps) {
  return (
    <>
      <circle cx="150" cy="58" r="50" fill={s} opacity="0.16" />
      <rect x="110" y="78" width="78" height="16" rx="4" fill={s} />
      <rect
        x="116"
        y="60"
        width="70"
        height="16"
        rx="4"
        fill={PAPER}
        stroke={s}
        strokeWidth="2.5"
      />
      <rect x="106" y="42" width="74" height="16" rx="4" fill={s} opacity="0.65" />
      <line x1="124" x2="124" y1="62" y2="74" stroke={t} strokeWidth="2" opacity="0.5" />
      <path d="M150 38 L190 8 L196 14 L156 42 Z" fill={PAPER} stroke={s} strokeWidth="2" />
      <path d="M150 38 L146 46 L156 42 Z" fill={t} />
    </>
  );
}
