import { Link } from 'react-router-dom';
import { addDays, format, isSameDay, startOfDay } from 'date-fns';
import { CalendarRange, Plus, Sun } from 'lucide-react';
import type { ClassItem, Task } from '@/types';
import { isOverdue } from '@/utils/dates';
import { Card, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/Misc';
import { Button } from '@/components/ui/Button';
import { useUIStore } from '@/stores/uiStore';
import { MiniTaskRow } from './MiniTaskRow';

interface Props {
  tasks: Task[];
  classMap: Record<string, ClassItem>;
  now: Date;
}

export function TodayCard({ tasks, classMap, now }: Props) {
  const openTaskForm = useUIStore((s) => s.openTaskForm);
  const today = tasks
    .filter((t) => isSameDay(new Date(t.dueAt), now) || isOverdue(t, now))
    .sort(
      (a, b) =>
        Number(a.status === 'done') - Number(b.status === 'done') || a.dueAt.localeCompare(b.dueAt),
    );
  const overdue = today.filter((t) => isOverdue(t, now)).length;

  return (
    <Card>
      <CardHeader
        title="Today"
        subtitle={overdue ? `${overdue} overdue need attention` : format(now, 'EEEE')}
        icon={<Sun className="h-4 w-4" />}
        action={
          <Button
            size="sm"
            variant="ghost"
            aria-label="Add a task due today"
            onClick={() => {
              const due = new Date(now);
              due.setHours(23, 59, 0, 0);
              openTaskForm(null, { dueAt: due.toISOString() });
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        }
      />
      {today.length === 0 ? (
        <EmptyState
          compact
          icon={<Sun className="h-6 w-6" />}
          title="Nothing due today"
          description="A free day! Maybe get ahead on next week?"
        />
      ) : (
        <ul className="-mx-1 divide-y divide-border">
          {today.slice(0, 7).map((t) => (
            <MiniTaskRow
              key={t.id}
              task={t}
              cls={t.classId ? classMap[t.classId] : undefined}
              now={now}
            />
          ))}
        </ul>
      )}
    </Card>
  );
}

export function UpcomingCard({ tasks, classMap, now }: Props) {
  const start = addDays(startOfDay(now), 1);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const byDay = days
    .map((d) => ({
      day: d,
      items: tasks.filter((t) => t.status !== 'done' && isSameDay(new Date(t.dueAt), d)),
    }))
    .filter((d) => d.items.length > 0);

  return (
    <Card>
      <CardHeader
        title="Next 7 days"
        icon={<CalendarRange className="h-4 w-4" />}
        action={
          <Link
            to="/calendar"
            className="rounded-sm px-2 py-1 text-xs font-semibold text-accent-text hover:bg-accent-soft"
          >
            Calendar
          </Link>
        }
      />
      {byDay.length === 0 ? (
        <EmptyState
          compact
          icon={<CalendarRange className="h-6 w-6" />}
          title="Clear week ahead"
          description="No upcoming deadlines in the next 7 days."
        />
      ) : (
        <div className="space-y-3">
          {byDay.slice(0, 4).map(({ day, items }) => (
            <div key={day.toISOString()}>
              <p className="mb-1 text-xs font-bold tracking-wide text-muted uppercase">
                {isSameDay(day, addDays(now, 1)) ? 'Tomorrow' : format(day, 'EEEE, MMM d')}
              </p>
              <ul className="-mx-1">
                {items.map((t) => (
                  <MiniTaskRow
                    key={t.id}
                    task={t}
                    cls={t.classId ? classMap[t.classId] : undefined}
                    now={now}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
