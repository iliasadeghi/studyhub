import { useMemo } from 'react';
import { create } from 'zustand';
import type { ClassItem, Contact } from '@/types';
import { supabase } from '@/lib/supabase';
import { classFromRow, classToRow, type ClassRow } from '@/services/rows';
import { remote, unwrap } from './sync';

interface ClassState {
  classes: ClassItem[];
  /** classId → students (teacher view only) */
  rosters: Record<string, Contact[]>;
  hydrate: (classes: ClassItem[], rosters?: Record<string, Contact[]>) => void;
  reset: () => void;
  /** Teachers: create a class. The server generates the join code. */
  addClass: (input: Omit<ClassItem, 'id' | 'joinCode' | 'teacherId'>) => Promise<ClassItem>;
  updateClass: (id: string, patch: Partial<ClassItem>) => void;
  /** Teachers: delete. Students: leave. */
  deleteClass: (id: string) => void;
  leaveClass: (id: string, studentId: string) => void;
  removeStudent: (classId: string, studentId: string) => void;
  /** Live update when a student joins (teacher view). */
  addToRoster: (classId: string, student: Contact) => void;
  /** Students: join with a code. Returns the class id. */
  joinClass: (code: string) => Promise<string>;
  moveClass: (id: string, direction: -1 | 1) => void;
}

const ORDER_KEY = 'studyhub:class-order';

function readOrder(): string[] {
  try {
    return JSON.parse(localStorage.getItem(ORDER_KEY) ?? '[]') as string[];
  } catch {
    return [];
  }
}

function saveOrder(classes: ClassItem[]) {
  try {
    localStorage.setItem(ORDER_KEY, JSON.stringify(classes.map((c) => c.id)));
  } catch {
    /* storage unavailable: order resets next load */
  }
}

/** Apply the user's saved card order (new classes go last). */
export function sortByOrder(classes: ClassItem[]): ClassItem[] {
  const order = readOrder();
  const rank = (id: string) => {
    const i = order.indexOf(id);
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };
  return [...classes].sort((a, b) => rank(a.id) - rank(b.id));
}

export const useClassStore = create<ClassState>()((set, get) => ({
  classes: [],
  rosters: {},
  hydrate: (classes, rosters = {}) => set({ classes: sortByOrder(classes), rosters }),
  reset: () => set({ classes: [], rosters: {} }),
  addClass: async (input) => {
    const row = unwrap(
      await supabase
        .from('classes')
        .insert({ ...classToRow(input), teacher_id: (await supabase.auth.getUser()).data.user?.id })
        .select()
        .single<ClassRow>(),
    );
    const item = classFromRow(row);
    set((s) => ({ classes: [...s.classes, item], rosters: { ...s.rosters, [item.id]: [] } }));
    return item;
  },
  updateClass: (id, patch) => {
    const before = get().classes;
    set({ classes: before.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
    void remote(
      supabase.from('classes').update(classToRow(patch)).eq('id', id),
      () => set({ classes: before }),
      'save the class',
    );
  },
  deleteClass: (id) => {
    const before = get().classes;
    set({ classes: before.filter((c) => c.id !== id) });
    void remote(
      supabase.from('classes').delete().eq('id', id),
      () => set({ classes: before }),
      'delete the class',
    );
  },
  leaveClass: (id, studentId) => {
    const before = get().classes;
    set({ classes: before.filter((c) => c.id !== id) });
    void remote(
      supabase.from('class_members').delete().eq('class_id', id).eq('student_id', studentId),
      () => set({ classes: before }),
      'leave the class',
    );
  },
  removeStudent: (classId, studentId) => {
    const before = get().rosters;
    set({
      rosters: { ...before, [classId]: (before[classId] ?? []).filter((s) => s.id !== studentId) },
    });
    void remote(
      supabase.from('class_members').delete().eq('class_id', classId).eq('student_id', studentId),
      () => set({ rosters: before }),
      'remove the student',
    );
  },
  addToRoster: (classId, student) =>
    set((s) => {
      const list = s.rosters[classId] ?? [];
      return {
        rosters: {
          ...s.rosters,
          [classId]: list.some((x) => x.id === student.id)
            ? list.map((x) => (x.id === student.id ? student : x))
            : [...list, student],
        },
      };
    }),
  joinClass: async (code) => {
    const classId = unwrap(await supabase.rpc('join_class', { code }));
    return classId as string;
  },
  moveClass: (id, direction) => {
    const list = [...get().classes];
    const i = list.findIndex((c) => c.id === id);
    const j = i + direction;
    if (i < 0 || j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    set({ classes: list });
    saveOrder(list);
  },
}));

/** Lookup helper hook: returns a map of id → class. */
export function useClassMap(): Record<string, ClassItem> {
  const classes = useClassStore((s) => s.classes);
  return useMemo(() => Object.fromEntries(classes.map((c) => [c.id, c])), [classes]);
}
