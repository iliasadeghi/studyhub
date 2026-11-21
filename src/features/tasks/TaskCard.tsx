import { memo } from 'react';
import { motion } from 'framer-motion';
import {
  AlarmClock,
  Clock,
  Link2,
  ListChecks,
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowRight,
} from 'lucide-react';
import type { ClassItem, Task } from '@/types';
import { cn } from '@/utils/cn';
import { formatDue, isOverdue } from '@/utils/dates';
import { formatMinutes } from '@/utils/format';
import { subjectVars } from '@/utils/colors';
import { SubjectTag } from '@/components/ui/Badge';
import { TaskCheckbox } from '@/components/ui/TaskCheckbox';
import { Menu, type MenuItem } from '@/components/ui/Menu';
import { useUIStore } from '@/stores/uiStore';
import { PriorityBadge } from './PriorityBadge';
import { STATUS_META, STATUS_ORDER, TYPE_META } from './taskMeta';
import { useTaskActions } from './useTaskActions';

interface TaskCardProps {
  task: Task;
  classItem?: ClassItem;
  variant?: 'row' | 'card';
  now?: Date;
  dragging?: boolean;
}

export const TaskCard = memo(function TaskCard({
  task,
  classItem,
  variant = 'row',
  now,
  dragging,
}: TaskCardProps) {
  const openTaskForm = useUIStore((s) => s.openTaskForm);
  const { toggleComplete, setStatus, remove } = useTaskActions();
  const done = task.status === 'done';
  const overdue = isOverdue(task, now);
  const TypeIcon = TYPE_META[task.type].icon;
  const subDone = task.subtasks.filter((s) => s.done).length;
  const color = classItem ? subjectVars(classItem.color).solid : undefined;

  const menuItems: MenuItem[] = [
    { label: 'Edit', icon: <Pencil className="h-4 w-4" />, onSelect: () => openTaskForm(task) },
    ...STATUS_ORDER.filter((s) => s !== task.status).map((s) => ({
      label: `Move to ${STATUS_META[s].label}`,
      icon: <ArrowRight className="h-4 w-4" />,
      onSelect: () => setStatus(task, s),
    })),
    {
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      onSelect: () => remove(task),
      danger: true,
    },
  ];

  return (
    <motion.article
      layout="position"
      aria-label={task.title}
      className={cn(
        'group relative flex gap-3 rounded-md border bg-surface transition-[box-shadow,border-color] duration-150',
        variant === 'row' ? 'items-start px-3 py-3 sm:px-4' : 'flex-col p-3',
        overdue ? 'border-danger/40' : 'border-border hover:border-border-strong',
        dragging ? 'shadow-pop ring-2 ring-accent' : 'shadow-soft hover:shadow-card',
      )}
    >
      {color && (
        <span
          aria-hidden
          className={cn(
            'absolute rounded-full',
            variant === 'row' ? 'top-3 bottom-3 left-0 w-[3px]' : 'top-0 right-3 left-3 h-[3px]',
          )}
          style={{ background: color }}
        />
      )}
      <div
        className={cn(
          'flex gap-3',
          variant === 'card' ? 'items-start' : 'min-w-0 flex-1 items-start',
        )}
      >
        <div className="pt-0.5">
          <TaskCheckbox
            checked={done}
            onChange={(origin) => toggleComplete(task, origin)}
            label={done ? `Mark "${task.title}" as not done` : `Complete "${task.title}"`}
            color={color}
          />
        </div>
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => openTaskForm(task)}
            onPointerDown={(e) => variant === 'row' && e.stopPropagation()}
            className={cn(
              'block max-w-full text-left text-sm leading-snug font-semibold hover:text-accent-text',
              done && 'text-muted line-through decoration-2',
            )}
          >
            {task.title}
          </button>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted">
            {classItem && <SubjectTag color={classItem.color}>{classItem.name}</SubjectTag>}
            <span className="inline-flex items-center gap-1">
              <TypeIcon className="h-3.5 w-3.5" aria-hidden />
              {TYPE_META[task.type].label}
            </span>
            <span
              className={cn(
                'inline-flex items-center gap-1',
                overdue && 'font-semibold text-danger-text',
              )}
            >
              {overdue ? (
                <AlarmClock className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <Clock className="h-3.5 w-3.5" aria-hidden />
              )}
              {overdue && <span className="sr-only">Overdue:</span>}
              {formatDue(task.dueAt, now)}
            </span>
            <span className="hidden sm:inline">~{formatMinutes(task.estimatedMinutes)}</span>
            {task.subtasks.length > 0 && (
              <span
                className="inline-flex items-center gap-1"
                aria-label={`${subDone} of ${task.subtasks.length} subtasks done`}
              >
                <ListChecks className="h-3.5 w-3.5" aria-hidden />
                {subDone}/{task.subtasks.length}
              </span>
            )}
            {task.links.length > 0 && (
              <span
                className="inline-flex items-center gap-1"
                aria-label={`${task.links.length} links`}
              >
                <Link2 className="h-3.5 w-3.5" aria-hidden />
                {task.links.length}
              </span>
            )}
          </div>
        </div>
      </div>
      <div
        className={cn(
          'flex shrink-0 items-center gap-1',
          variant === 'card' && 'justify-between pl-[34px]',
        )}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <PriorityBadge task={task} now={now} />
        <div className="ml-auto">
          <Menu
            items={menuItems}
            trigger={(props) => (
              <button
                type="button"
                {...props}
                aria-label={`Actions for "${task.title}"`}
                className="grid h-8 w-8 place-items-center rounded-sm text-muted hover:bg-surface-2 hover:text-fg"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            )}
          />
        </div>
      </div>
    </motion.article>
  );
});
