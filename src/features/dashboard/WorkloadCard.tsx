import { Link } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';
import type { ClassItem, Task } from '@/types';
import { subjectVars } from '@/utils/colors';
import { formatMinutes } from '@/utils/format';
import { Card, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/Misc';

/** Estimated remaining minutes of open work per class. */
export function WorkloadCard({ tasks, classes }: { tasks: Task[]; classes: ClassItem[] }) {
  const rows = classes
    .map((c) => {
      const open = tasks.filter((t) => t.classId === c.id && t.status !== 'done');
      return {
        cls: c,
        minutes: open.reduce((sum, t) => sum + t.estimatedMinutes, 0),
        count: open.length,
      };
    })
    .filter((r) => r.count > 0)
    .sort((a, b) => b.minutes - a.minutes);
  const max = Math.max(1, ...rows.map((r) => r.minutes));
  const total = rows.reduce((s, r) => s + r.minutes, 0);

  return (
    <Card>
      <CardHeader
        title="Workload by class"
        subtitle={total ? `${formatMinutes(total)} of open work` : undefined}
        icon={<BarChart3 className="h-4 w-4" />}
      />
      {rows.length === 0 ? (
        <EmptyState
          compact
          icon={<BarChart3 className="h-6 w-6" />}
          title="No open work"
          description="Your classes are all clear."
        />
      ) : (
        <ul className="space-y-3" aria-label="Estimated time of open tasks per class">
          {rows.map(({ cls, minutes, count }) => {
            const v = subjectVars(cls.color);
            return (
              <li key={cls.id}>
                <Link to={`/classes/${cls.id}`} className="group block rounded-sm">
                  <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
                    <span className="truncate font-semibold group-hover:text-accent-text">
                      {cls.name}
                    </span>
                    <span className="shrink-0 text-muted">
                      {formatMinutes(minutes)} · {count} task{count > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full transition-[width] duration-700 ease-smooth"
                      style={{
                        width: `${Math.max(6, (minutes / max) * 100)}%`,
                        background: v.solid,
                      }}
                    />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
