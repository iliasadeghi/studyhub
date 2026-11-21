import { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useUIStore } from '@/stores/uiStore';

const COLORS = [
  'var(--accent)',
  'var(--c-amber)',
  'var(--c-green)',
  'var(--c-pink)',
  'var(--c-cyan)',
  'var(--c-purple)',
];

function Burst({ x, y }: { x: number; y: number }) {
  const particles = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => {
        const angle = (i / 18) * Math.PI * 2 + Math.random() * 0.3;
        const dist = 40 + Math.random() * 50;
        return {
          dx: Math.cos(angle) * dist,
          dy: Math.sin(angle) * dist - 20,
          color: COLORS[i % COLORS.length],
          size: 5 + Math.random() * 5,
          rotate: Math.random() * 360,
          round: i % 3 === 0,
        };
      }),
    [],
  );
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[80]">
      {particles.map((p, i) => (
        <motion.span
          key={i}
          className="absolute block"
          style={{
            left: x,
            top: y,
            width: p.size,
            height: p.round ? p.size : p.size * 0.5,
            background: p.color,
            borderRadius: p.round ? 999 : 2,
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0.6, rotate: 0 }}
          animate={{ x: p.dx, y: p.dy + 30, opacity: 0, scale: 1, rotate: p.rotate }}
          transition={{ duration: 0.9, ease: [0.2, 0.8, 0.3, 1] }}
        />
      ))}
    </div>
  );
}

/** Small confetti burst when a task is completed. Skipped for reduced-motion users. */
export function Celebration() {
  const burst = useUIStore((s) => s.burst);
  const reduce = useReducedMotion();
  if (!burst || reduce) return null;
  return createPortal(<Burst key={burst.key} x={burst.x} y={burst.y} />, document.body);
}
