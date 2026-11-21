/**
 * Hand-built subject illustrations (viewBox 200×112). They use the theme's
 * subject color variables so they adapt to light/dark mode automatically.
 */
export interface ArtProps {
  s: string; // solid subject color
  t: string; // high-contrast subject text color
}

const PAPER = 'var(--surface)';

function Halo({ s }: { s: string }) {
  return (
    <>
      <circle cx="150" cy="58" r="50" fill={s} opacity="0.16" />
      <circle cx="150" cy="58" r="34" fill={s} opacity="0.12" />
    </>
  );
}

export function MathArt({ s, t }: ArtProps) {
  return (
    <>
      <Halo s={s} />
      <g transform="rotate(-6 140 56)">
        <rect
          x="96"
          y="18"
          width="92"
          height="74"
          rx="10"
          fill={PAPER}
          stroke={s}
          strokeWidth="2.5"
        />
        {[34, 50, 66, 80].map((y) => (
          <line key={y} x1="102" x2="182" y1={y} y2={y} stroke={s} opacity="0.15" />
        ))}
        {[114, 130, 146, 162, 176].map((x) => (
          <line key={x} y1="24" y2="86" x1={x} x2={x} stroke={s} opacity="0.15" />
        ))}
        <line x1="104" x2="182" y1="74" y2="74" stroke={t} strokeWidth="1.5" opacity="0.6" />
        <line x1="142" x2="142" y1="24" y2="88" stroke={t} strokeWidth="1.5" opacity="0.6" />
        <path
          d="M110 30 Q142 118 174 30"
          fill="none"
          stroke={s}
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <circle cx="142" cy="74" r="4" fill={t} />
        <circle cx="121" cy="56" r="3" fill={s} />
        <circle cx="163" cy="56" r="3" fill={s} />
      </g>
      <circle cx="184" cy="22" r="15" fill={s} />
      <text x="184" y="28" textAnchor="middle" fontSize="17" fontWeight="800" fill={PAPER}>
        π
      </text>
      <rect x="70" y="80" width="38" height="22" rx="11" fill={PAPER} stroke={s} strokeWidth="2" />
      <text x="89" y="96" textAnchor="middle" fontSize="12" fontWeight="800" fill={t}>
        √x
      </text>
    </>
  );
}

export function ScienceArt({ s, t }: ArtProps) {
  return (
    <>
      <Halo s={s} />
      {/* DNA helix */}
      <g opacity="0.9">
        <path
          d="M84 14 C104 30 104 46 84 62 C64 78 64 94 84 110"
          fill="none"
          stroke={s}
          strokeWidth="3"
        />
        <path
          d="M84 14 C64 30 64 46 84 62 C104 78 104 94 84 110"
          fill="none"
          stroke={t}
          strokeWidth="3"
          opacity="0.6"
        />
        {[26, 38, 50, 74, 86, 98].map((y) => (
          <line key={y} x1="74" x2="94" y1={y} y2={y} stroke={s} strokeWidth="2" opacity="0.45" />
        ))}
      </g>
      {/* Flask */}
      <path
        d="M140 22 H156 V44 L180 86 Q183 98 172 98 H124 Q113 98 116 86 L140 44 Z"
        fill={PAPER}
        stroke={s}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M128 66 Q148 58 168 66 L180 86 Q183 98 172 98 H124 Q113 98 116 86 Z"
        fill={s}
        opacity="0.85"
      />
      <rect x="135" y="16" width="26" height="7" rx="3.5" fill={s} />
      <circle cx="142" cy="82" r="3.5" fill={PAPER} opacity="0.9" />
      <circle cx="156" cy="88" r="2.5" fill={PAPER} opacity="0.9" />
      <circle cx="160" cy="76" r="2" fill={PAPER} opacity="0.9" />
      <circle cx="152" cy="10" r="3" fill={s} opacity="0.6" />
      <circle cx="162" cy="4" r="2" fill={s} opacity="0.4" />
      {/* Leaf */}
      <path d="M186 40 Q200 20 196 6 Q178 10 176 28 Q175 36 186 40 Z" fill={s} opacity="0.75" />
      <path d="M186 40 Q188 24 196 6" fill="none" stroke={PAPER} strokeWidth="1.5" opacity="0.8" />
    </>
  );
}

export function EnglishArt({ s, t }: ArtProps) {
  return (
    <>
      <Halo s={s} />
      <path d="M94 46 V102 Q121 92 148 102 Q175 92 202 102 V46 Z" fill={s} opacity="0.85" />
      <path
        d="M98 40 Q123 30 148 42 V96 Q123 86 98 96 Z"
        fill={PAPER}
        stroke={s}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M148 42 Q173 30 198 40 V96 Q173 86 148 96 Z"
        fill={PAPER}
        stroke={s}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {[52, 60, 68, 76].map((y, i) => (
        <g key={y} stroke={s} strokeWidth="2" strokeLinecap="round" opacity="0.35">
          <line x1="106" x2={i === 3 ? 126 : 140} y1={y} y2={y - 3} />
          <line x1="156" x2={i === 2 ? 174 : 190} y1={y - 3} y2={y} />
        </g>
      ))}
      {/* Quill */}
      <path d="M196 4 Q206 26 184 44 L166 60 L163 57 Q176 26 196 4 Z" fill={s} />
      <path d="M166 60 L184 40" stroke={PAPER} strokeWidth="1.5" opacity="0.7" />
      <path d="M166 60 L160 68" stroke={t} strokeWidth="2.5" strokeLinecap="round" />
      <rect x="62" y="18" width="38" height="26" rx="10" fill={PAPER} stroke={s} strokeWidth="2" />
      <text
        x="81"
        y="36"
        textAnchor="middle"
        fontSize="13"
        fontWeight="800"
        fill={t}
        fontFamily="Georgia, serif"
      >
        Aa
      </text>
    </>
  );
}

export function HistoryArt({ s, t }: ArtProps) {
  return (
    <>
      <Halo s={s} />
      {/* Column */}
      <rect x="120" y="16" width="48" height="9" rx="2" fill={s} />
      <path d="M124 25 h40 l-4 6 h-32 z" fill={s} opacity="0.7" />
      <rect x="128" y="31" width="32" height="58" fill={PAPER} stroke={s} strokeWidth="2.5" />
      {[136, 144, 152].map((x) => (
        <line key={x} x1={x} x2={x} y1="35" y2="85" stroke={s} strokeWidth="2" opacity="0.4" />
      ))}
      <rect x="122" y="89" width="44" height="6" rx="1.5" fill={s} opacity="0.7" />
      <rect x="116" y="95" width="56" height="9" rx="2" fill={s} />
      {/* Scroll */}
      <rect x="66" y="64" width="48" height="30" rx="3" fill={PAPER} stroke={s} strokeWidth="2.5" />
      <circle cx="66" cy="79" r="6" fill={s} />
      <circle cx="114" cy="79" r="6" fill={s} />
      {[73, 80, 87].map((y) => (
        <line key={y} x1="76" x2="104" y1={y} y2={y} stroke={t} strokeWidth="1.5" opacity="0.45" />
      ))}
      {/* Coin */}
      <circle cx="186" cy="28" r="14" fill={s} />
      <circle cx="186" cy="28" r="9.5" fill="none" stroke={PAPER} strokeWidth="1.5" opacity="0.8" />
      <text x="186" y="32.5" textAnchor="middle" fontSize="11" fontWeight="800" fill={PAPER}>
        Ⅳ
      </text>
    </>
  );
}

export function LanguagesArt({ s, t }: ArtProps) {
  return (
    <>
      <Halo s={s} />
      <path
        d="M104 16 h70 a12 12 0 0 1 12 12 v18 a12 12 0 0 1 -12 12 h-46 l-12 10 v-10 h-12 a12 12 0 0 1 -12 -12 v-18 a12 12 0 0 1 12 -12 z"
        fill={s}
      />
      <text x="139" y="43" textAnchor="middle" fontSize="16" fontWeight="800" fill={PAPER}>
        ¡Hola!
      </text>
      <path
        d="M78 62 h56 a10 10 0 0 1 10 10 v12 a10 10 0 0 1 -10 10 h-8 v9 l-11 -9 h-37 a10 10 0 0 1 -10 -10 v-12 a10 10 0 0 1 10 -10 z"
        fill={PAPER}
        stroke={s}
        strokeWidth="2.5"
      />
      <text x="106" y="83" textAnchor="middle" fontSize="13" fontWeight="800" fill={t}>
        Hello
      </text>
      <rect
        x="152"
        y="68"
        width="44"
        height="24"
        rx="12"
        fill={PAPER}
        stroke={s}
        strokeWidth="2"
        opacity="0.95"
      />
      <text x="174" y="84" textAnchor="middle" fontSize="11" fontWeight="800" fill={t}>
        Ciao
      </text>
      <g transform="translate(190 16)" stroke={t} strokeWidth="1.5" fill="none" opacity="0.8">
        <circle r="9" fill={PAPER} />
        <ellipse rx="4" ry="9" />
        <line x1="-9" x2="9" />
      </g>
    </>
  );
}

export function CodeArt({ s, t }: ArtProps) {
  const lines: [number, number, number, number][] = [
    [104, 36, 30, 1],
    [140, 36, 22, 0.5],
    [112, 46, 40, 0.75],
    [156, 46, 16, 0.4],
    [112, 56, 26, 0.5],
    [142, 56, 30, 1],
    [104, 66, 18, 1],
    [104, 76, 46, 0.4],
  ];
  return (
    <>
      <Halo s={s} />
      <rect
        x="92"
        y="14"
        width="106"
        height="80"
        rx="10"
        fill={PAPER}
        stroke={s}
        strokeWidth="2.5"
      />
      <path
        d="M92 24 a10 10 0 0 1 10 -10 h86 a10 10 0 0 1 10 10 v4 h-106 z"
        fill={s}
        opacity="0.85"
      />
      {[102, 110, 118].map((x) => (
        <circle key={x} cx={x} cy="21" r="2.5" fill={PAPER} />
      ))}
      {lines.map(([x, y, w, o], i) => (
        <rect
          key={i}
          x={x}
          y={y - 3}
          width={w}
          height="5"
          rx="2.5"
          fill={i % 3 === 1 ? t : s}
          opacity={o}
        />
      ))}
      <rect x="152" y="72" width="3" height="10" fill={t} className="animate-pulse" />
      <circle cx="90" cy="88" r="17" fill={s} />
      <text
        x="90"
        y="93"
        textAnchor="middle"
        fontSize="13"
        fontWeight="800"
        fill={PAPER}
        fontFamily="JetBrains Mono, monospace"
      >
        {'</>'}
      </text>
    </>
  );
}
