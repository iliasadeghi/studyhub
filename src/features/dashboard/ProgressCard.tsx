import { Flame, TrendingUp } from 'lucide-react';
import type { Task } from '@/types';
import { completionStreak, weeklyProgress } from '@/utils/dates';
import { Card, CardHeader } from '@/components/ui/Card';
import { ProgressRing } from '@/components/ui/Misc';

function encouragement(pct: number, total: number): string {
  if (total === 0) return 'No deadlines this week. Get ahead on something!';
  if (pct >= 1) return 'Week complete. Incredible!';
  if (pct >= 0.66) return 'Almost there. Keep the momentum!';
  if (pct >= 0.33) return 'Solid progress. One task at a time.';
  return "Let's get the ball rolling.";
}

export function ProgressCard({
  tasks,
  now,
  weekStartsOn,
}: {
  tasks: Task[];
  now: Date;
  weekStartsOn: 0 | 1;
}) {
  const { done, total } = weeklyProgress(tasks, now, weekStartsOn);
  const pct = total ? done / total : 0;
  const streak = completionStreak(tasks, now);

  return (
    <Card>
      <CardHeader title="This week" icon={<TrendingUp className="h-4 w-4" />} />
      <div className="flex items-center gap-5">
        <ProgressRing
          value={pct}
          size={104}
          label={`${done} of ${total} tasks due this week completed`}
        >
          <div className="text-center">
            <p className="text-2xl leading-none font-extrabold">{Math.round(pct * 100)}%</p>
            <p className="mt-1 text-[11px] font-semibold text-muted">
              {done}/{total} done
            </p>
          </div>
        </ProgressRing>
        <div className="min-w-0 flex-1 space-y-3">
          <p className="text-sm text-muted">{encouragement(pct, total)}</p>
          <div className="flex items-center gap-3 rounded-md bg-orange-soft px-3 py-2.5">
            <Flame className="h-6 w-6 shrink-0 text-orange" aria-hidden />
            <div>
              <p className="text-lg leading-none font-extrabold text-orange">
                {streak} day{streak === 1 ? '' : 's'}
              </p>
              <p className="mt-0.5 text-xs font-medium text-muted">completion streak</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
