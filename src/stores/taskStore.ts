import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Task, TaskStatus } from '@/types';
import { uid } from '@/utils/id';
import { getSampleData } from '@/mockData';
import { STORE_VERSION, storageKey } from './persist';

export type TaskInput = Partial<Omit<Task, 'id' | 'createdAt'>> & { title: string };

interface TaskState {
  tasks: Task[];
  addTask: (input: TaskInput) => Task;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => Task | undefined;
  restoreTask: (task: Task) => void;
  setStatus: (id: string, status: TaskStatus) => void;
  toggleComplete: (id: string) => Task | undefined;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  replaceAll: (tasks: Task[]) => void;
  detachClass: (classId: string) => void;
}

export function makeTask(input: TaskInput): Task {
  const now = new Date();
  const due = new Date(now);
  due.setDate(due.getDate() + 1);
  due.setHours(23, 59, 0, 0);
  return {
    id: uid('task'),
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

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: getSampleData().tasks,
      addTask: (input) => {
        const task = makeTask(input);
        set((s) => ({ tasks: [task, ...s.tasks] }));
        return task;
      },
      updateTask: (id, patch) =>
        set((s) => ({
          tasks: s.tasks.map((t) => {
            if (t.id !== id) return t;
            const next = { ...t, ...patch };
            return patch.status ? withStatus(next, patch.status) : next;
          }),
        })),
      deleteTask: (id) => {
        const task = get().tasks.find((t) => t.id === id);
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
        return task;
      },
      restoreTask: (task) =>
        set((s) => ({
          tasks: s.tasks.some((t) => t.id === task.id)
            ? s.tasks.map((t) => (t.id === task.id ? task : t))
            : [task, ...s.tasks],
        })),
      setStatus: (id, status) =>
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? withStatus(t, status) : t)) })),
      toggleComplete: (id) => {
        const before = get().tasks.find((t) => t.id === id);
        if (!before) return undefined;
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? withStatus(t, t.status === 'done' ? 'todo' : 'done') : t,
          ),
        }));
        return before;
      },
      toggleSubtask: (taskId, subtaskId) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  subtasks: t.subtasks.map((st) =>
                    st.id === subtaskId ? { ...st, done: !st.done } : st,
                  ),
                }
              : t,
          ),
        })),
      replaceAll: (tasks) => set({ tasks }),
      detachClass: (classId) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.classId === classId ? { ...t, classId: null } : t)),
        })),
    }),
    { name: storageKey('tasks'), version: STORE_VERSION },
  ),
);
