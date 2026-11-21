import { format, isSameDay } from 'date-fns';
import { CalendarCheck, CalendarPlus, Clock, MapPin, Plus, Sparkles, Trash2 } from 'lucide-react';
import type { Task } from '@/types';
import { useEventStore } from '@/stores/eventStore';
import { useTaskStore } from '@/stores/taskStore';
import { useUIStore } from '@/stores/uiStore';
import { useClassMap } from '@/stores/classStore';
import { subjectVars } from '@/utils/colors';
import { formatMinutes } from '@/utils/format';
import { Card } from '@/components/ui/Card';
import { Button, IconButton } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Misc';
import { MiniTaskRow } from '@/features/dashboard/MiniTaskRow';
import type { CalendarItem } from './useCalendarItems';

export function DayPanel({ day, items, now }: { day: Date; items: CalendarItem[]; now: Date }) {
  const openTaskForm = useUIStore((s) => s.openTaskForm);
  const pushToast = useUIStore((s) => s.pushToast);
  const addEvent = useEventStore((s) => s.addEvent);
  const deleteEvent = useEventStore((s) => s.deleteEvent);
  const classMap = useClassMap();

  const tasks = items
    .filter((i): i is Extract<CalendarItem, { kind: 'task' }> => i.kind === 'task')
    .map((i) => i.task);
  const events = items.filter(
    (i): i is Extract<CalendarItem, { kind: 'event' }> => i.kind === 'event',
  );
  const study = items.filter(
    (i): i is Extract<CalendarItem, { kind: 'study' }> => i.kind === 'study',
  );

  const addTask = () => {
    const due = new Date(day);
    due.setHours(23, 59, 0, 0);
    openTaskForm(null, { dueAt: due.toISOString() });
  };

  const acceptBlock = (b: Extract<CalendarItem, { kind: 'study' }>, task: Task | undefined) => {
    const start = new Date(b.date);
    start.setHours(16, 0, 0, 0);
    const end = new Date(start.getTime() + b.block.minutes * 60_000);
    addEvent({
      title: b.title,
      start: start.toISOString(),
      end: end.toISOString(),
      classId: task?.classId ?? null,
      teacherId: null,
      kind: 'study',
      notes: `${b.block.minutes}-minute study block`,
    });
    pushToast({
      variant: 'success',
      title: 'Study block added',
      description: `${format(start, 'EEE, MMM d')} at 4 PM`,
    });
  };

  return (
    <Card className="lg:sticky lg:top-20">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-bold tracking-wide text-accent-text uppercase">
            {isSameDay(day, now) ? 'Today' : format(day, 'EEEE')}
          </p>
          <h2 className="text-lg font-extrabold">{format(day, 'MMMM d, yyyy')}</h2>
        </div>
        <Button size="sm" variant="soft" leftIcon={<Plus className="h-4 w-4" />} onClick={addTask}>
          Task
        </Button>
      </div>

      {items.length === 0 && (
        <EmptyState
          compact
          icon={<CalendarCheck className="h-6 w-6" />}
          title="Nothing scheduled"
          description="Add a task for this day, or drag one here from the calendar."
        />
      )}

      {events.length > 0 && (
        <section aria-label="Events" className="mb-4 space-y-2">
          {events.map(({ event: e }) => {
            const cls = e.classId ? classMap[e.classId] : undefined;
            return (
              <div
                key={e.id}
                className="flex items-start gap-3 rounded-md border border-border p-2.5"
              >
                <span
                  aria-hidden
                  className="mt-1 h-8 w-1 shrink-0 rounded-full"
                  style={{ background: cls ? subjectVars(cls.color).solid : 'var(--accent)' }}
                />
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-semibold">{e.title}</p>
                  <p className="flex items-center gap-1 text-xs text-muted">
                    <Clock className="h-3 w-3" aria-hidden />
                    {format(new Date(e.start), 'h:mm a')} – {format(new Date(e.end), 'h:mm a')}
                  </p>
                  {e.notes && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                      <MapPin className="h-3 w-3" aria-hidden />
                      {e.notes}
                    </p>
                  )}
                </div>
                <IconButton
                  size="sm"
                  label={`Delete event "${e.title}"`}
                  onClick={() => deleteEvent(e.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </IconButton>
              </div>
            );
          })}
        </section>
      )}

      {tasks.length > 0 && (
        <section aria-label="Tasks due" className="mb-4">
          <h3 className="mb-1 text-xs font-bold tracking-wide text-muted uppercase">Due</h3>
          <ul className="-mx-1">
            {tasks.map((t) => (
              <MiniTaskRow
                key={t.id}
                task={t}
                cls={t.classId ? classMap[t.classId] : undefined}
                now={now}
              />
            ))}
          </ul>
        </section>
      )}

      {study.length > 0 && (
        <section aria-label="Suggested study blocks">
          <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold tracking-wide text-muted uppercase">
            <Sparkles className="h-3.5 w-3.5 text-accent-text" aria-hidden /> Suggested study plan
          </h3>
          <ul className="space-y-2">
            {study.map((s) => (
              <li
                key={s.id}
                className="flex items-center gap-2 rounded-md border border-dashed border-border-strong p-2.5 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{s.title}</p>
                  <p className="text-xs text-muted">{formatMinutes(s.block.minutes)} suggested</p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  leftIcon={<CalendarPlus className="h-4 w-4" />}
                  onClick={() =>
                    acceptBlock(
                      s,
                      useTaskStore.getState().tasks.find((t) => t.id === s.block.taskId),
                    )
                  }
                >
                  Add
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </Card>
  );
}
