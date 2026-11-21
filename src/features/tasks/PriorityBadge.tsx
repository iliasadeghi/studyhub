import { Flame } from 'lucide-react';
import type { Task } from '@/types';
import { computePriority } from '@/utils/priority';
import { Badge } from '@/components/ui/Badge';
import { Tooltip } from '@/components/ui/Misc';
import { PRIORITY_META } from './taskMeta';

export function PriorityBadge({ task, now }: { task: Task; now?: Date }) {
  if (task.status === 'done') return null;
  const { level, score, reasons } = computePriority(task, now);
  const meta = PRIORITY_META[level];
  return (
    <Tooltip
      content={
        <span className="block text-left">
          <span className="block font-bold">Priority score {score}/100</span>
          {reasons.map((r) => (
            <span key={r} className="block opacity-80">
              • {r}
            </span>
          ))}
        </span>
      }
    >
      <Badge
        tone={meta.tone}
        tabIndex={0}
        aria-label={`${meta.label} priority, score ${score}. ${reasons.join(', ')}`}
        icon={level === 'critical' ? <Flame className="h-3 w-3" aria-hidden /> : undefined}
      >
        {meta.label}
      </Badge>
    </Tooltip>
  );
}
