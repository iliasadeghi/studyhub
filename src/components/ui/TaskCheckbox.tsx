import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface TaskCheckboxProps {
  checked: boolean;
  onChange: (origin: { x: number; y: number }) => void;
  label: string;
  size?: 'sm' | 'md';
  color?: string;
}

/** Round animated completion checkbox. */
export function TaskCheckbox({ checked, onChange, label, size = 'md', color }: TaskCheckboxProps) {
  const reduce = useReducedMotion();
  const dim = size === 'sm' ? 'h-[18px] w-[18px]' : 'h-[22px] w-[22px]';
  return (
    <motion.button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        const r = e.currentTarget.getBoundingClientRect();
        onChange({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
      }}
      onPointerDown={(e) => e.stopPropagation()}
      whileTap={reduce ? undefined : { scale: 0.85 }}
      className={cn(
        'group relative grid shrink-0 place-items-center rounded-full border-2 transition-colors duration-200',
        dim,
        checked ? 'border-transparent' : 'border-border-strong hover:border-accent',
      )}
      style={checked ? { background: color ?? 'var(--accent)' } : undefined}
    >
      <svg viewBox="0 0 16 16" className="h-3/4 w-3/4" aria-hidden>
        <motion.path
          d="M3.5 8.5 6.5 11.5 12.5 4.5"
          fill="none"
          stroke={checked ? 'white' : 'var(--accent)'}
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
          transition={{ duration: reduce ? 0 : 0.25, ease: 'easeOut' }}
        />
      </svg>
      {checked && !reduce && (
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-full"
          style={{ boxShadow: `0 0 0 2px ${color ?? 'var(--accent)'}` }}
          initial={{ scale: 1, opacity: 0.7 }}
          animate={{ scale: 1.9, opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      )}
    </motion.button>
  );
}
