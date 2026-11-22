import { GraduationCap } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useSchoolName } from '@/stores/schoolStore';

export function Logo({ compact, className }: { compact?: boolean; className?: string }) {
  const school = useSchoolName();
  const custom = school !== 'StudyHub';
  return (
    <span className={cn('inline-flex min-w-0 items-center gap-2.5', className)}>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-accent text-accent-fg shadow-soft">
        <GraduationCap className="h-5 w-5" aria-hidden />
      </span>
      {!compact && (
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-lg font-extrabold tracking-tight">
            {custom ? school : 'StudyHub'}
          </span>
          {custom && (
            <span className="text-[11px] font-semibold tracking-wide text-muted uppercase">
              StudyHub
            </span>
          )}
        </span>
      )}
    </span>
  );
}
