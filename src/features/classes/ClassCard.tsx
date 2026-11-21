import { Link } from 'react-router-dom';
import { Clock, DoorOpen, User } from 'lucide-react';
import type { ClassItem, Task, Teacher } from '@/types';
import { subjectVars } from '@/utils/colors';
import { formatDue, isOverdue } from '@/utils/dates';
import { rankTasks } from '@/utils/priority';
import { scheduleLabel } from '@/utils/classes';
import { SubjectArt } from './art/SubjectArt';
import { artBackground } from './art/pickArt';

export function ClassCard({
  cls,
  teacher,
  tasks,
  now,
}: {
  cls: ClassItem;
  teacher?: Teacher;
  tasks: Task[];
  now: Date;
}) {
  const v = subjectVars(cls.color);
  const open = tasks.filter((t) => t.status !== 'done');
  const overdue = open.filter((t) => isOverdue(t, now)).length;
  const next = rankTasks(open, now)[0];

  return (
    <Link
      to={`/classes/${cls.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-card"
    >
      <div className="relative h-28 overflow-hidden" style={artBackground(cls.color)}>
        <SubjectArt
          cls={cls}
          className="absolute inset-y-0 right-0 h-full w-full py-2 pr-3 transition-transform duration-300 ease-smooth group-hover:-translate-y-1 group-hover:scale-[1.03]"
        />
        <span
          className="absolute top-3 left-4 rounded-full bg-surface/90 px-2.5 py-0.5 text-xs font-bold shadow-soft"
          style={{ color: v.text }}
        >
          {cls.subject}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h2 className="text-lg font-bold group-hover:text-accent-text">{cls.name}</h2>
        <dl className="mt-2 space-y-1.5 text-sm text-muted">
          <div className="flex items-center gap-2">
            <dt className="sr-only">Teacher</dt>
            <User className="h-4 w-4 shrink-0" aria-hidden />
            <dd className="truncate">{teacher?.name ?? 'No teacher set'}</dd>
          </div>
          <div className="flex items-center gap-2">
            <dt className="sr-only">Room</dt>
            <DoorOpen className="h-4 w-4 shrink-0" aria-hidden />
            <dd>{cls.room || '—'}</dd>
          </div>
          <div className="flex items-center gap-2">
            <dt className="sr-only">Schedule</dt>
            <Clock className="h-4 w-4 shrink-0" aria-hidden />
            <dd className="truncate">{scheduleLabel(cls)}</dd>
          </div>
        </dl>
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3 text-sm">
          <span className="font-semibold">
            {open.length} open task{open.length === 1 ? '' : 's'}
            {overdue > 0 && <span className="text-danger-text"> · {overdue} overdue</span>}
          </span>
          {next && (
            <span className="truncate text-xs text-muted">Next: {formatDue(next.dueAt, now)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
