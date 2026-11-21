import { create } from 'zustand';
import type { Task, TaskStatus } from '@/types';
import { supabase } from '@/lib/supabase';
import { taskToRow } from '@/services/rows';
import { newId, remote } from './sync';

export type TaskInput = Partial<Omit<Task, 'id' | 'createdAt'>> & { title: string };

interface TaskState {
  tasks: Task[];
  hydrate: (tasks: Task[]) => void;
  reset: () => void;
  addTask: (input: TaskInput) => Task;
  saveTask: (task: Task) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => Task | undefined;
  restoreTask: (task: Task) => void;
  setStatus: (id: string, status: TaskStatus) => void;
  toggleComplete: (id: string) => Task | undefined;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  detachClass: (classId: string) => void;
}

export function makeTask(input: TaskInput): Task {
  const now = new Date();
  const due = new Date(now);
  due.setDate(due.getDate() + 1);
  due.setHours(23, 59, 0, 0);
  return {
    id: newId(),
    description: '',
    classId: null,
    type: 'homework',
    dueAt: due.toISOString(),
    estimatedMinutes: 30,
    importance: 'medium',
    status: 'todo',
    subtasks: [],
    links: [],
    completedAt: null,
    quadrantOverride: null,
    ...input,
    createdAt: now.toISOString(),
  };
}

function withStatus(task: Task, status: TaskStatus): Task {
  return {
    ...task,
    status,
    completedAt: status === 'done' ? (task.completedAt ?? new Date().toISOString()) : null,
  };
}

export const useTaskStore = create<TaskState>()((set, get) => {
  /** Apply a change locally, then persist; roll back to the previous list on failure. */
  const patchRemote = (id: string, next: Task, action = 'save the task') => {
    const before = get().tasks;
    set({ tasks: before.map((t) => (t.id === id ? next : t)) });
    void remote(
      supabase
        .from('tasks')
        .update(taskToRow({ ...next, id: undefined, createdAt: undefined }))
        .eq('id', id),
      () => set({ tasks: before }),
      action,
    );
  };

  const upsert = (task: Task, action: string) => {
    const before = get().tasks;
    set({
      tasks: before.some((t) => t.id === task.id)
        ? before.map((t) => (t.id === task.id ? task : t))
        : [task, ...before],
    });
    void remote(
      supabase.from('tasks').upsert(taskToRow(task)),
      () => set({ tasks: before }),
      action,
    );
  };

  return {
    tasks: [],
    hydrate: (tasks) => set({ tasks }),
    reset: () => set({ tasks: [] }),
    addTask: (input) => {
      const task = makeTask(input);
      upsert(task, 'add the task');
      return task;
    },
    saveTask: (task) => upsert(task, 'save the task'),
    updateTask: (id, patch) => {
      const cur = get().tasks.find((t) => t.id === id);
      if (!cur) return;
      const merged = { ...cur, ...patch };
      patchRemote(id, patch.status ? withStatus(merged, patch.status) : merged);
    },
    deleteTask: (id) => {
      const before = get().tasks;
      const task = before.find((t) => t.id === id);
      set({ tasks: before.filter((t) => t.id !== id) });
      void remote(
        supabase.from('tasks').delete().eq('id', id),
        () => set({ tasks: before }),
        'delete the task',
      );
      return task;
    },
    restoreTask: (task) => upsert(task, 'restore the task'),
    setStatus: (id, status) => {
      const cur = get().tasks.find((t) => t.id === id);
      if (cur) patchRemote(id, withStatus(cur, status), 'update the task');
    },
    toggleComplete: (id) => {
      const before = get().tasks.find((t) => t.id === id);
      if (!before) return undefined;
      patchRemote(
        id,
        withStatus(before, before.status === 'done' ? 'todo' : 'done'),
        'update the task',
      );
      return before;
    },
    toggleSubtask: (taskId, subtaskId) => {
      const cur = get().tasks.find((t) => t.id === taskId);
      if (!cur) return;
      patchRemote(taskId, {
        ...cur,
        subtasks: cur.subtasks.map((st) => (st.id === subtaskId ? { ...st, done: !st.done } : st)),
      });
    },
    // The database sets class_id to null when a class is removed; mirror it locally.
    detachClass: (classId) =>
      set((s) => ({
        tasks: s.tasks.map((t) => (t.classId === classId ? { ...t, classId: null } : t)),
      })),
  };
});
