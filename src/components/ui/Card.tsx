import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
  interactive?: boolean;
}

export function Card({ padded = true, interactive, className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-surface shadow-soft',
        padded && 'p-4 sm:p-5',
        interactive &&
          'transition-all duration-200 ease-smooth hover:-translate-y-0.5 hover:border-border-strong hover:shadow-card',
        className,
      )}
      {...rest}
    />
  );
}

interface CardHeaderProps {
  title: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  subtitle?: ReactNode;
  as?: 'h2' | 'h3';
}

export function CardHeader({ title, icon, action, subtitle, as: Tag = 'h2' }: CardHeaderProps) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        {icon && (
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-sm bg-accent-soft text-accent-text">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <Tag className="truncate text-base font-bold">{title}</Tag>
          {subtitle && <p className="truncate text-xs text-muted">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
