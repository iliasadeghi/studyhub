/** Science illustrations: chemistry, biology, medicine, physics (viewBox 200×112). */
import type { ArtProps } from './illustrations';

const PAPER = 'var(--surface)';

function Halo({ s }: { s: string }) {
  return (
    <>
      <circle cx="140" cy="58" r="50" fill={s} opacity="0.16" />
      <circle cx="140" cy="58" r="34" fill={s} opacity="0.12" />
    </>
  );
}

/** Benzene ring, periodic-table tile and a round-bottom flask. */
export function ChemistryArt({ s, t }: ArtProps) {
  const hex: [number, number][] = [
    [108, 38],
    [127, 49],
    [127, 71],
    [108, 82],
    [89, 71],
    [89, 49],
  ];
  return (
    <>
      <Halo s={s} />
      <polygon
        points={hex.map((p) => p.join(',')).join(' ')}
        fill="none"
        stroke={s}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* alternating double bonds */}
      <line x1="111" y1="44" x2="123" y2="51" stroke={s} strokeWidth="2" />
      <line x1="123" y1="69" x2="111" y2="76" stroke={s} strokeWidth="2" />
      <line x1="93" y1="68" x2="93" y2="52" stroke={s} strokeWidth="2" />
      {hex.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="4" fill={PAPER} stroke={t} strokeWidth="2" />
      ))}
      {/* periodic tile */}
      <rect
        x="148"
        y="10"
        width="42"
        height="46"
        rx="7"
        fill={PAPER}
        stroke={s}
        strokeWidth="2.5"
      />
      <text x="154" y="22" fontSize="8" fontWeight="700" fill={t}>
        6
      </text>
      <text x="169" y="43" textAnchor="middle" fontSize="20" fontWeight="800" fill={t}>
        C
      </text>
      <text x="169" y="52" textAnchor="middle" fontSize="6" fontWeight="600" fill={t} opacity="0.7">
        Carbon
      </text>
      {/* round-bottom flask */}
      <rect x="163" y="62" width="10" height="14" rx="2" fill={PAPER} stroke={s} strokeWidth="2" />
      <circle cx="168" cy="90" r="16" fill={PAPER} stroke={s} strokeWidth="2.5" />
      <path d="M152.5 92 A16 16 0 0 0 183.5 92 Z" fill={s} opacity="0.85" />
      <circle cx="162" cy="96" r="2.2" fill={PAPER} />
      <circle cx="172" cy="99" r="1.6" fill={PAPER} />
    </>
  );
}

/** Plant/animal cell, microscope and a leaf. */
export function BiologyArt({ s, t }: ArtProps) {
  return (
    <>
      <Halo s={s} />
      <ellipse cx="132" cy="60" rx="42" ry="30" fill={PAPER} stroke={s} strokeWidth="2.5" />
      <circle cx="124" cy="58" r="12" fill={s} opacity="0.8" />
      <circle cx="121" cy="55" r="4" fill={PAPER} />
      <ellipse
        cx="154"
        cy="70"
        rx="10"
        ry="5"
        fill={s}
        opacity="0.45"
        transform="rotate(-20 154 70)"
      />
      <ellipse
        cx="150"
        cy="44"
        rx="7"
        ry="4"
        fill={t}
        opacity="0.35"
        transform="rotate(25 150 44)"
      />
      {[
        [104, 72],
        [112, 80],
        [144, 82],
        [160, 54],
      ].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r="2" fill={t} opacity="0.5" />
      ))}
      {/* microscope */}
      <rect x="60" y="96" width="40" height="7" rx="3" fill={s} />
      <path
        d="M90 96 V72 Q90 58 78 52"
        fill="none"
        stroke={s}
        strokeWidth="6"
        strokeLinecap="round"
      />
      <rect
        x="66"
        y="22"
        width="12"
        height="30"
        rx="3"
        fill={PAPER}
        stroke={t}
        strokeWidth="2"
        transform="rotate(-20 72 37)"
      />
      <rect x="64" y="76" width="28" height="4" rx="2" fill={t} />
      {/* leaf */}
      <path d="M186 36 Q200 18 196 4 Q178 8 176 26 Q175 33 186 36 Z" fill={s} opacity="0.75" />
      <path d="M186 36 Q188 22 196 4" fill="none" stroke={PAPER} strokeWidth="1.5" opacity="0.8" />
    </>
  );
}

/** Heart with an ECG trace, stethoscope and a medical cross. */
export function MedicineArt({ s, t }: ArtProps) {
  return (
    <>
      <Halo s={s} />
      <path
        d="M132 94 C98 72 92 46 112 37 C123 32 132 40 132 47 C132 40 141 32 152 37 C172 46 166 72 132 94 Z"
        fill={s}
        opacity="0.9"
      />
      <path
        d="M66 62 H104 L110 50 L118 78 L125 54 L130 62 H196"
        fill="none"
        stroke={PAPER}
        strokeWidth="5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d="M66 62 H104 L110 50 L118 78 L125 54 L130 62 H196"
        fill="none"
        stroke={t}
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* stethoscope */}
      <path
        d="M70 18 V36 A13 13 0 0 0 96 36 V18"
        fill="none"
        stroke={t}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="70" cy="16" r="3" fill={t} />
      <circle cx="96" cy="16" r="3" fill={t} />
      <path d="M83 49 V80" stroke={t} strokeWidth="3" />
      <circle cx="83" cy="88" r="9" fill={PAPER} stroke={s} strokeWidth="2.5" />
      <circle cx="83" cy="88" r="3.5" fill={s} />
      {/* cross badge */}
      <circle cx="182" cy="22" r="15" fill={PAPER} stroke={s} strokeWidth="2.5" />
      <rect x="179" y="13" width="6" height="18" rx="1.5" fill={s} />
      <rect x="173" y="19" width="18" height="6" rx="1.5" fill={s} />
    </>
  );
}

/** Atom with electron orbits, a wave and E = mc². */
export function PhysicsArt({ s, t }: ArtProps) {
  return (
    <>
      <Halo s={s} />
      {[0, 60, 120].map((deg) => (
        <ellipse
          key={deg}
          cx="140"
          cy="58"
          rx="38"
          ry="13"
          fill="none"
          stroke={s}
          strokeWidth="2.5"
          transform={`rotate(${deg} 140 58)`}
        />
      ))}
      <circle cx="140" cy="58" r="8" fill={s} />
      <circle cx="178" cy="58" r="4" fill={t} />
      <circle cx="121" cy="25" r="4" fill={t} />
      <circle cx="121" cy="91" r="4" fill={t} />
      <path
        d="M62 30 Q70 16 78 30 T94 30 T110 30"
        fill="none"
        stroke={t}
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.7"
      />
      <rect x="60" y="78" width="54" height="22" rx="11" fill={PAPER} stroke={s} strokeWidth="2" />
      <text x="87" y="93" textAnchor="middle" fontSize="11" fontWeight="800" fill={t}>
        E=mc²
      </text>
    </>
  );
}
