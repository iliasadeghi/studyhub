import { format } from 'date-fns';
import type { ClassItem, Task } from '@/types';
import { cn } from '@/utils/cn';
import { subjectVars } from '@/utils/colors';
import { isOverdue } from '@/utils/dates';
import { TaskCheckbox } from '@/components/ui/TaskCheckbox';
import { useTaskActions } from '@/features/tasks/useTaskActions';
import { useUIStore } from '@/stores/uiStore';

export function MiniTaskRow({
  task,
  cls,
  now,
  showDay,
}: {
  task: Task;
  cls?: ClassItem;
  now: Date;
  showDay?: boolean;
}) {
  const { toggleComplete } = useTaskActions();
  const openTaskForm = useUIStore((s) => s.openTaskForm);
  const done = task.status === 'done';
  const overdue = isOverdue(task, now);
  return (
    <li className="flex items-center gap-3 rounded-md px-1 py-1.5">
      <TaskCheckbox
        size="sm"
        checked={done}
        onChange={(o) => toggleComplete(task, o)}
        label={done ? `Mark "${task.title}" as not done` : `Complete "${task.title}"`}
        color={cls ? subjectVars(cls.color).solid : undefined}
      />
      {cls && (
        <span
          aria-hidden
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ background: subjectVars(cls.color).solid }}
        />
      )}
      <button
        type="button"
        onClick={() => openTaskForm(task)}
        className={cn(
          'min-w-0 flex-1 truncate text-left text-sm font-medium hover:text-accent-text',
          done && 'text-muted line-through',
        )}
      >
        {task.title}
      </button>
      <span
        className={cn(
          'shrink-0 text-xs text-muted tabular-nums',
          overdue && 'font-semibold text-danger-text',
        )}
      >
        {format(new Date(task.dueAt), showDay ? 'EEE' : 'h:mm a')}
      </span>
    </li>
  );
}
