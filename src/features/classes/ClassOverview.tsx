import { Link } from 'react-router-dom';
import { AlarmClock, BookOpenText, CheckCircle2, ListTodo } from 'lucide-react';
import type { ClassItem, Note, Task } from '@/types';
import { isOverdue } from '@/utils/dates';
import { rankTasks } from '@/utils/priority';
import { Card, CardHeader } from '@/components/ui/Card';
import { EmptyState, ProgressRing } from '@/components/ui/Misc';
import { MiniTaskRow } from '@/features/dashboard/MiniTaskRow';

interface Props {
  cls: ClassItem;
  tasks: Task[];
  notes: Note[];
  now: Date;
  onTab: (t: 'tasks' | 'notes') => void;
}

function Stat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  tone?: string;
}) {
  return (
    <Card className="flex items-center gap-3">
      <span
        className="grid h-10 w-10 place-items-center rounded-md bg-surface-2"
        style={tone ? { color: tone } : undefined}
      >
        {icon}
      </span>
      <div>
        <p className="text-xl leading-none font-extrabold">{value}</p>
        <p className="mt-1 text-xs text-muted">{label}</p>
      </div>
    </Card>
  );
}

export function ClassOverview({ cls, tasks, notes, now, onTab }: Props) {
  const open = tasks.filter((t) => t.status !== 'done');
  const done = tasks.length - open.length;
  const overdue = open.filter((t) => isOverdue(t, now)).length;
  const next = rankTasks(open, now).slice(0, 4);
  const recentNotes = [...notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 3);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          icon={<ListTodo className="h-5 w-5" />}
          label="Open tasks"
          value={open.length}
          tone="var(--accent-text)"
        />
        <Stat
          icon={<AlarmClock className="h-5 w-5" />}
          label="Overdue"
          value={overdue}
          tone={overdue ? 'var(--danger)' : undefined}
        />
        <Stat
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Completed"
          value={done}
          tone="var(--success)"
        />
        <Stat icon={<BookOpenText className="h-5 w-5" />} label="Notes" value={notes.length} />
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Up next"
            icon={<ListTodo className="h-4 w-4" />}
            action={
              <button
                type="button"
                onClick={() => onTab('tasks')}
                className="rounded-sm px-2 py-1 text-xs font-semibold text-accent-text hover:bg-accent-soft"
              >
                All tasks
              </button>
            }
          />
          {next.length === 0 ? (
            <EmptyState
              compact
              icon={<CheckCircle2 className="h-6 w-6" />}
              title="All caught up"
              description={`Nothing left for ${cls.name}.`}
            />
          ) : (
            <ul className="-mx-1">
              {next.map((t) => (
                <MiniTaskRow key={t.id} task={t} cls={cls} now={now} showDay />
              ))}
            </ul>
          )}
        </Card>
        <Card className="flex flex-col items-center justify-center gap-3 text-center">
          <ProgressRing
            value={tasks.length ? done / tasks.length : 0}
            label={`${done} of ${tasks.length} tasks completed`}
          >
            <span className="text-lg font-extrabold">
              {tasks.length ? Math.round((done / tasks.length) * 100) : 0}%
            </span>
          </ProgressRing>
          <p className="text-sm text-muted">of all {cls.name} tasks done</p>
        </Card>
      </div>
      <Card>
        <CardHeader
          title="Latest notes"
          icon={<BookOpenText className="h-4 w-4" />}
          action={
            <button
              type="button"
              onClick={() => onTab('notes')}
              className="rounded-sm px-2 py-1 text-xs font-semibold text-accent-text hover:bg-accent-soft"
            >
              All notes
            </button>
          }
        />
        {recentNotes.length === 0 ? (
          <p className="text-sm text-muted">No notes yet.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {recentNotes.map((n) => (
              <li key={n.id}>
                <Link
                  to={`/notes/${n.id}`}
                  className="block h-full rounded-md border border-border p-3 hover:border-border-strong hover:bg-surface-2"
                >
                  <p className="text-xs text-muted">{n.unit}</p>
                  <p className="mt-0.5 text-sm font-semibold">{n.title}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
