import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { subjectVars } from '@/utils/colors';
import type { SubjectColor } from '@/types';

type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'orange';

const tones: Record<Tone, string> = {
  neutral: 'bg-surface-2 text-muted',
  accent: 'bg-accent-soft text-accent-text',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger-text',
  info: 'bg-info-soft text-info',
  orange: 'bg-orange-soft text-orange',
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  icon?: ReactNode;
}

export function Badge({ tone = 'neutral', icon, className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex h-6 shrink-0 items-center gap-1 rounded-full px-2.5 text-xs font-semibold whitespace-nowrap',
        tones[tone],
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </span>
  );
}

export function SubjectTag({
  color,
  children,
  className,
}: {
  color: SubjectColor;
  children: ReactNode;
  className?: string;
}) {
  const v = subjectVars(color);
  return (
    <span
      className={cn(
        'inline-flex h-6 max-w-full shrink-0 items-center gap-1.5 truncate rounded-full px-2.5 text-xs font-semibold',
        className,
      )}
      style={{ background: v.soft, color: v.text }}
    >
      <span
        aria-hidden
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ background: v.solid }}
      />
      <span className="truncate">{children}</span>
    </span>
  );
}
