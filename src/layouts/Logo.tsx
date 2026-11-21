import { GraduationCap } from 'lucide-react';
import { cn } from '@/utils/cn';

export function Logo({ compact, className }: { compact?: boolean; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-accent text-accent-fg shadow-soft">
        <GraduationCap className="h-5 w-5" aria-hidden />
      </span>
      {!compact && <span className="text-lg font-extrabold tracking-tight">StudyHub</span>}
    </span>
  );
}
