import { create } from 'zustand';
import { uid } from '@/utils/id';
import type { Task } from '@/types';

export type ToastVariant = 'default' | 'success' | 'error' | 'celebrate';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  action?: { label: string; onClick: () => void };
  duration: number;
}

interface TaskFormState {
  open: boolean;
  /** Existing task to edit, or null for create */
  task: Task | null;
  /** Prefill values for a new task */
  defaults: Partial<Task>;
}

interface UIState {
  toasts: Toast[];
  taskForm: TaskFormState;
  commandOpen: boolean;
  shortcutsOpen: boolean;
  sidebarExpanded: boolean;
  /** Latest celebration burst (key changes each time) */
  burst: { key: number; x: number; y: number } | null;
  celebrate: (origin?: { x: number; y: number }) => void;
  pushToast: (
    t: Omit<Toast, 'id' | 'variant' | 'duration'> & Partial<Pick<Toast, 'variant' | 'duration'>>,
  ) => string;
  dismissToast: (id: string) => void;
  openTaskForm: (task?: Task | null, defaults?: Partial<Task>) => void;
  closeTaskForm: () => void;
  setCommandOpen: (open: boolean) => void;
  setShortcutsOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  toasts: [],
  taskForm: { open: false, task: null, defaults: {} },
  commandOpen: false,
  shortcutsOpen: false,
  sidebarExpanded: false,
  burst: null,
  celebrate: (origin) =>
    set({
      burst: {
        key: Date.now(),
        x: origin?.x ?? window.innerWidth / 2,
        y: origin?.y ?? window.innerHeight / 2,
      },
    }),
  pushToast: (t) => {
    const id = uid('toast');
    set((s) => ({
      toasts: [...s.toasts.slice(-3), { variant: 'default', duration: 4500, ...t, id }],
    }));
    return id;
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  openTaskForm: (task = null, defaults = {}) => set({ taskForm: { open: true, task, defaults } }),
  closeTaskForm: () => set((s) => ({ taskForm: { ...s.taskForm, open: false } })),
  setCommandOpen: (commandOpen) => set({ commandOpen }),
  setShortcutsOpen: (shortcutsOpen) => set({ shortcutsOpen }),
  toggleSidebar: () => set((s) => ({ sidebarExpanded: !s.sidebarExpanded })),
}));

/** Convenience for non-component code. */
export const toast = (...args: Parameters<UIState['pushToast']>) =>
  useUIStore.getState().pushToast(...args);
