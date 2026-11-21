/** Geometry, statistics/economics, geography, music, psychology and extra fallbacks (viewBox 200×112). */
import type { ArtProps } from './illustrations';

const PAPER = 'var(--surface)';

function Halo({ s }: { s: string }) {
  return <circle cx="140" cy="58" r="50" fill={s} opacity="0.16" />;
}

/** Protractor, set square and compass. */
export function GeometryArt({ s, t }: ArtProps) {
  return (
    <>
      <Halo s={s} />
      <path d="M96 96 A44 44 0 0 1 184 96 Z" fill={PAPER} stroke={s} strokeWidth="2.5" />
      <path
        d="M116 96 A24 24 0 0 1 164 96"
        fill="none"
        stroke={s}
        strokeWidth="1.5"
        opacity="0.6"
      />
      {[0, 30, 60, 90, 120, 150, 180].map((a) => {
        const r = (Math.PI * a) / 180;
        return (
          <line
            key={a}
            x1={140 - Math.cos(r) * 44}
            y1={96 - Math.sin(r) * 44}
            x2={140 - Math.cos(r) * 37}
            y2={96 - Math.sin(r) * 37}
            stroke={t}
            strokeWidth="1.5"
          />
        );
      })}
      <polygon points="60,100 60,40 104,100" fill={s} opacity="0.85" />
      <polygon points="68,92 68,62 90,92" fill={PAPER} />
      <circle cx="176" cy="12" r="4" fill={t} />
      <line x1="176" y1="12" x2="160" y2="52" stroke={t} strokeWidth="3" strokeLinecap="round" />
      <line x1="176" y1="12" x2="192" y2="52" stroke={t} strokeWidth="3" strokeLinecap="round" />
      <path d="M156 58 L160 52" stroke={s} strokeWidth="2" />
    </>
  );
}

/** Rising bar chart with a trend arrow and a coin. */
export function StatsArt({ s, t }: ArtProps) {
  const bars: [number, number][] = [
    [104, 22],
    [122, 34],
    [140, 28],
    [158, 48],
  ];
  return (
    <>
      <Halo s={s} />
      <rect
        x="92"
        y="16"
        width="100"
        height="82"
        rx="10"
        fill={PAPER}
        stroke={s}
        strokeWidth="2.5"
      />
      <line x1="100" y1="88" x2="184" y2="88" stroke={t} strokeWidth="1.5" opacity="0.5" />
      {bars.map(([x, h], i) => (
        <rect
          key={x}
          x={x}
          y={88 - h}
          width="12"
          height={h}
          rx="2"
          fill={s}
          opacity={0.45 + i * 0.18}
        />
      ))}
      <polyline
        points="102,62 128,48 146,56 172,30"
        fill="none"
        stroke={t}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M172 30 L162 31 M172 30 L170 40"
        stroke={t}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="74" cy="84" r="16" fill={s} />
      <circle cx="74" cy="84" r="11" fill="none" stroke={PAPER} strokeWidth="1.5" opacity="0.7" />
      <text x="74" y="89.5" textAnchor="middle" fontSize="15" fontWeight="800" fill={PAPER}>
        $
      </text>
    </>
  );
}

/** Globe, map pin and mountains. */
export function EarthArt({ s, t }: ArtProps) {
  return (
    <>
      <circle cx="134" cy="58" r="36" fill={s} opacity="0.85" />
      <path
        d="M114 40 Q122 32 132 36 Q138 44 130 50 Q122 52 118 58 Q110 54 114 40 Z"
        fill={PAPER}
        opacity="0.85"
      />
      <path
        d="M140 62 Q152 56 160 64 Q162 76 150 82 Q142 80 140 72 Z"
        fill={PAPER}
        opacity="0.85"
      />
      <ellipse
        cx="134"
        cy="58"
        rx="16"
        ry="36"
        fill="none"
        stroke={PAPER}
        strokeWidth="1.5"
        opacity="0.5"
      />
      <line x1="98" y1="58" x2="170" y2="58" stroke={PAPER} strokeWidth="1.5" opacity="0.5" />
      <path d="M184 44 C176 32 176 18 184 12 C192 18 192 32 184 44 Z" fill={t} />
      <circle cx="184" cy="22" r="4" fill={PAPER} />
      <polygon points="56,104 78,70 94,92 104,80 124,104" fill={s} opacity="0.5" />
      <polygon points="78,70 84,79 72,79" fill={PAPER} opacity="0.8" />
    </>
  );
}

/** Staff with beamed notes and headphones. */
export function MusicArt({ s, t }: ArtProps) {
  return (
    <>
      <Halo s={s} />
      {[34, 42, 50, 58, 66].map((y) => (
        <line key={y} x1="100" x2="196" y1={y} y2={y} stroke={s} strokeWidth="1.5" opacity="0.35" />
      ))}
      <ellipse cx="122" cy="70" rx="8" ry="6" fill={s} transform="rotate(-20 122 70)" />
      <ellipse cx="152" cy="62" rx="8" ry="6" fill={s} transform="rotate(-20 152 62)" />
      <line x1="129" y1="68" x2="129" y2="28" stroke={s} strokeWidth="3" />
      <line x1="159" y1="60" x2="159" y2="20" stroke={s} strokeWidth="3" />
      <polygon points="129,28 159,20 159,27 129,35" fill={s} />
      <ellipse cx="184" cy="82" rx="8" ry="6" fill={t} transform="rotate(-20 184 82)" />
      <line x1="191" y1="80" x2="191" y2="48" stroke={t} strokeWidth="3" />
      <path
        d="M60 78 A26 26 0 0 1 112 78"
        fill="none"
        stroke={t}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <rect x="54" y="74" width="14" height="24" rx="6" fill={s} />
      <rect x="104" y="74" width="14" height="24" rx="6" fill={s} />
    </>
  );
}

/** Brain with folds and a thought bubble. */
export function PsychologyArt({ s, t }: ArtProps) {
  return (
    <>
      <Halo s={s} />
      <path
        d="M114 34 C114 20 134 16 142 24 C150 14 170 18 170 32 C184 34 186 52 176 58 C182 70 170 82 156 78 C150 88 130 88 124 80 C110 84 100 72 106 62 C94 56 98 38 114 34 Z"
        fill={s}
        opacity="0.85"
      />
      <path d="M142 24 C138 44 146 60 142 84" fill="none" stroke={PAPER} strokeWidth="2.5" />
      <path
        d="M118 46 Q126 42 130 50 M122 64 Q130 60 134 68 M152 40 Q160 36 164 44 M154 60 Q162 56 168 62"
        fill="none"
        stroke={PAPER}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <rect x="54" y="22" width="40" height="28" rx="12" fill={PAPER} stroke={s} strokeWidth="2" />
      <circle cx="84" cy="56" r="3.5" fill={PAPER} stroke={s} strokeWidth="1.5" />
      <circle cx="94" cy="64" r="2.5" fill={PAPER} stroke={s} strokeWidth="1.5" />
      <text x="74" y="41" textAnchor="middle" fontSize="15" fontWeight="800" fill={t}>
        ?
      </text>
    </>
  );
}

/** Fallback: lightbulb with sparkles. */
export function IdeaArt({ s, t }: ArtProps) {
  return (
    <>
      <Halo s={s} />
      <circle cx="140" cy="48" r="26" fill={PAPER} stroke={s} strokeWidth="2.5" />
      <path d="M130 70 H150 V84 H130 Z" fill={s} />
      <path d="M132 90 H148" stroke={t} strokeWidth="3" strokeLinecap="round" />
      <path
        d="M134 56 Q140 36 146 56"
        fill="none"
        stroke={t}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {[
        [100, 30],
        [180, 24],
        [186, 76],
        [96, 80],
      ].map(([x, y]) => (
        <path
          key={`${x}${y}`}
          d={`M${x} ${y - 7} L${x + 2} ${y - 2} L${x + 7} ${y} L${x + 2} ${y + 2} L${x} ${y + 7} L${x - 2} ${y + 2} L${x - 7} ${y} L${x - 2} ${y - 2} Z`}
          fill={s}
          opacity="0.7"
        />
      ))}
    </>
  );
}

/** Fallback: notebook with a checklist and a pencil. */
export function NotebookArt({ s, t }: ArtProps) {
  return (
    <>
      <Halo s={s} />
      <rect
        x="104"
        y="14"
        width="70"
        height="86"
        rx="8"
        fill={PAPER}
        stroke={s}
        strokeWidth="2.5"
      />
      {[16, 30, 44, 58, 72, 86].map((y) => (
        <circle key={y} cx="104" cy={y + 4} r="3" fill={s} />
      ))}
      {[32, 50, 68].map((y, i) => (
        <g key={y}>
          <rect
            x="116"
            y={y - 6}
            width="10"
            height="10"
            rx="2.5"
            fill={i < 2 ? s : 'none'}
            stroke={s}
            strokeWidth="2"
          />
          {i < 2 && (
            <path d={`M118 ${y - 1} l2.5 2.5 l4 -5`} stroke={PAPER} strokeWidth="1.8" fill="none" />
          )}
          <line
            x1="132"
            y1={y - 1}
            x2={i === 1 ? 152 : 162}
            y2={y - 1}
            stroke={t}
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.5"
          />
        </g>
      ))}
      <path d="M70 100 L112 58" stroke={t} strokeWidth="6" strokeLinecap="round" />
      <path d="M112 58 L118 52 L120 54 L114 60 Z" fill={s} />
    </>
  );
}
