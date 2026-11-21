import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import type { ClassItem, Task } from '@/types';
import { DUE_GROUP_LABELS, DUE_GROUP_ORDER, groupTasksByDue, type DueGroup } from '@/utils/dates';
import { cn } from '@/utils/cn';
import { TaskCard } from './TaskCard';

interface Props {
  tasks: Task[];
  classMap: Record<string, ClassItem>;
  now: Date;
  weekStartsOn: 0 | 1;
}

function Group({
  id,
  label,
  tasks,
  classMap,
  now,
  defaultOpen = true,
  danger,
}: {
  id: string;
  label: string;
  tasks: Task[];
  classMap: Record<string, ClassItem>;
  now: Date;
  defaultOpen?: boolean;
  danger?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const headingId = `group-${id}`;
  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className="mb-2">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex w-full items-center gap-2 rounded-sm py-1 text-left text-sm font-bold"
        >
          <ChevronDown
            className={cn(
              'h-4 w-4 text-muted transition-transform duration-200',
              !open && '-rotate-90',
            )}
            aria-hidden
          />
          <span className={cn(danger && 'text-danger-text')}>{label}</span>
          <span
            className={cn(
              'grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px]',
              danger ? 'bg-danger-soft text-danger-text' : 'bg-surface-2 text-muted',
            )}
          >
            {tasks.length}
          </span>
        </button>
      </h2>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-2 overflow-hidden p-0.5"
          >
            <AnimatePresence initial={false}>
              {tasks.map((t) => (
                <motion.li
                  key={t.id}
                  layout="position"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 24, transition: { duration: 0.18 } }}
                >
                  <TaskCard
                    task={t}
                    classItem={t.classId ? classMap[t.classId] : undefined}
                    now={now}
                  />
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
        )}
      </AnimatePresence>
    </section>
  );
}

export function ListView({ tasks, classMap, now, weekStartsOn }: Props) {
  const open = tasks.filter((t) => t.status !== 'done');
  const done = tasks.filter((t) => t.status === 'done');
  const groups = groupTasksByDue(open, now, weekStartsOn);

  return (
    <div className="space-y-6">
      {DUE_GROUP_ORDER.filter((g) => groups[g].length > 0).map((g: DueGroup) => (
        <Group
          key={g}
          id={g}
          label={DUE_GROUP_LABELS[g]}
          tasks={groups[g]}
          classMap={classMap}
          now={now}
          danger={g === 'overdue'}
        />
      ))}
      {done.length > 0 && (
        <Group
          id="done"
          label="Completed"
          tasks={done}
          classMap={classMap}
          now={now}
          defaultOpen={open.length === 0}
        />
      )}
    </div>
  );
}
