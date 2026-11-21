import { useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ClassItem } from '@/types';
import { uid } from '@/utils/id';
import { getSampleData } from '@/mockData';
import { STORE_VERSION, storageKey } from './persist';

interface ClassState {
  classes: ClassItem[];
  addClass: (input: Omit<ClassItem, 'id'>) => ClassItem;
  updateClass: (id: string, patch: Partial<ClassItem>) => void;
  deleteClass: (id: string) => void;
  moveClass: (id: string, direction: -1 | 1) => void;
  replaceAll: (classes: ClassItem[]) => void;
}

export const useClassStore = create<ClassState>()(
  persist(
    (set) => ({
      classes: getSampleData().classes,
      addClass: (input) => {
        const item = { ...input, id: uid('class') };
        set((s) => ({ classes: [...s.classes, item] }));
        return item;
      },
      updateClass: (id, patch) =>
        set((s) => ({ classes: s.classes.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      deleteClass: (id) => set((s) => ({ classes: s.classes.filter((c) => c.id !== id) })),
      moveClass: (id, direction) =>
        set((s) => {
          const i = s.classes.findIndex((c) => c.id === id);
          const j = i + direction;
          if (i < 0 || j < 0 || j >= s.classes.length) return s;
          const next = [...s.classes];
          [next[i], next[j]] = [next[j], next[i]];
          return { classes: next };
        }),
      replaceAll: (classes) => set({ classes }),
    }),
    { name: storageKey('classes'), version: STORE_VERSION },
  ),
);

/** Lookup helper hook: returns a map of id → class. */
export function useClassMap(): Record<string, ClassItem> {
  const classes = useClassStore((s) => s.classes);
  return useMemo(() => Object.fromEntries(classes.map((c) => [c.id, c])), [classes]);
}
