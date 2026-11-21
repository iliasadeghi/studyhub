import { AnimatePresence, motion } from 'framer-motion';
import { PartyPopper, Target } from 'lucide-react';
import type { ClassItem, Task } from '@/types';
import { computePriority, rankTasks } from '@/utils/priority';
import { formatDue, isOverdue } from '@/utils/dates';
import { cn } from '@/utils/cn';
import { subjectVars } from '@/utils/colors';
import { Card, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/Misc';
import { SubjectTag } from '@/components/ui/Badge';
import { TaskCheckbox } from '@/components/ui/TaskCheckbox';
import { PriorityBadge } from '@/features/tasks/PriorityBadge';
import { useTaskActions } from '@/features/tasks/useTaskActions';
import { useUIStore } from '@/stores/uiStore';

export function FocusNowCard({
  tasks,
  classMap,
  now,
}: {
  tasks: Task[];
  classMap: Record<string, ClassItem>;
  now: Date;
}) {
  const top = rankTasks(tasks, now).slice(0, 3);
  const { toggleComplete } = useTaskActions();
  const openTaskForm = useUIStore((s) => s.openTaskForm);

  return (
    <Card className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-accent-soft blur-3xl"
      />
      <CardHeader
        title="Focus now"
        subtitle="Your top 3, ranked by deadline, importance and effort"
        icon={<Target className="h-4 w-4" />}
      />
      {top.length === 0 ? (
        <EmptyState
          compact
          icon={<PartyPopper className="h-6 w-6" />}
          title="All caught up!"
          description="Nothing left to do. Enjoy the break — you earned it."
        />
      ) : (
        <ol className="relative space-y-2.5">
          <AnimatePresence initial={false}>
            {top.map((t, i) => {
              const cls = t.classId ? classMap[t.classId] : undefined;
              const reason = computePriority(t, now).reasons[0];
              return (
                <motion.li
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  className="flex items-center gap-3 rounded-md border border-border bg-surface p-3 shadow-soft"
                >
                  <span
                    aria-hidden
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-extrabold"
                    style={
                      cls
                        ? {
                            background: subjectVars(cls.color).soft,
                            color: subjectVars(cls.color).text,
                          }
                        : undefined
                    }
                  >
                    {i + 1}
                  </span>
                  <TaskCheckbox
                    checked={false}
                    onChange={(o) => toggleComplete(t, o)}
                    label={`Complete "${t.title}"`}
                    color={cls ? subjectVars(cls.color).solid : undefined}
                  />
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => openTaskForm(t)}
                      className="block max-w-full truncate text-left text-sm font-semibold hover:text-accent-text"
                    >
                      {t.title}
                    </button>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted">
                      {cls && <SubjectTag color={cls.color}>{cls.name}</SubjectTag>}
                      <span className={cn(isOverdue(t, now) && 'font-semibold text-danger-text')}>
                        {formatDue(t.dueAt, now)}
                      </span>
                      <span className="hidden sm:inline">· {reason}</span>
                    </div>
                  </div>
                  <PriorityBadge task={t} now={now} />
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ol>
      )}
    </Card>
  );
}
