import { useCallback } from 'react';
import type { Task, TaskStatus } from '@/types';
import { useTaskStore } from '@/stores/taskStore';
import { useUIStore } from '@/stores/uiStore';

const CHEERS = ['Nice work!', 'Crushed it!', 'One down!', 'Look at you go!', 'Done and dusted!'];

/** Task mutations that come with toasts, undo, and celebration. */
export function useTaskActions() {
  const pushToast = useUIStore((s) => s.pushToast);
  const celebrate = useUIStore((s) => s.celebrate);

  const toggleComplete = useCallback(
    (task: Task, origin?: { x: number; y: number }) => {
      const store = useTaskStore.getState();
      const before = store.toggleComplete(task.id);
      if (!before) return;
      if (before.status !== 'done') {
        celebrate(origin);
        pushToast({
          variant: 'celebrate',
          title: CHEERS[Math.floor(Math.random() * CHEERS.length)],
          description: `"${task.title}" marked complete.`,
          action: { label: 'Undo', onClick: () => useTaskStore.getState().restoreTask(before) },
        });
      }
    },
    [pushToast, celebrate],
  );

  const setStatus = useCallback(
    (task: Task, status: TaskStatus, origin?: { x: number; y: number }) => {
      if (task.status === status) return;
      if (status === 'done') return toggleComplete(task, origin);
      useTaskStore.getState().setStatus(task.id, status);
    },
    [toggleComplete],
  );

  const remove = useCallback(
    (task: Task) => {
      const deleted = useTaskStore.getState().deleteTask(task.id);
      if (!deleted) return;
      pushToast({
        title: 'Task deleted',
        description: deleted.title,
        action: { label: 'Undo', onClick: () => useTaskStore.getState().restoreTask(deleted) },
      });
    },
    [pushToast],
  );

  return { toggleComplete, setStatus, remove };
}
