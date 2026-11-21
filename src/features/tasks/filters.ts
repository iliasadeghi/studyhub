import type { PriorityLevel, Task, TaskStatus, TaskType } from '@/types';
import { computePriority } from '@/utils/priority';

export type SortKey = 'priority' | 'due' | 'title' | 'created';

export interface TaskFilters {
  search: string;
  classId: string;
  type: TaskType | 'all';
  status: TaskStatus | 'all';
  priority: PriorityLevel | 'all';
  sort: SortKey;
}

export const DEFAULT_FILTERS: TaskFilters = {
  search: '',
  classId: 'all',
  type: 'all',
  status: 'all',
  priority: 'all',
  sort: 'priority',
};

export function activeFilterCount(f: TaskFilters): number {
  return [
    f.classId !== 'all',
    f.type !== 'all',
    f.status !== 'all',
    f.priority !== 'all',
    !!f.search.trim(),
  ].filter(Boolean).length;
}

export function sortTasks(tasks: Task[], sort: SortKey, now: Date): Task[] {
  const scored = tasks.map((t) => ({ t, score: computePriority(t, now).score }));
  scored.sort((a, b) => {
    switch (sort) {
      case 'priority':
        return b.score - a.score || a.t.dueAt.localeCompare(b.t.dueAt);
      case 'due':
        return a.t.dueAt.localeCompare(b.t.dueAt);
      case 'title':
        return a.t.title.localeCompare(b.t.title);
      case 'created':
        return b.t.createdAt.localeCompare(a.t.createdAt);
    }
  });
  return scored.map((s) => s.t);
}

export function applyFilters(tasks: Task[], f: TaskFilters, now: Date): Task[] {
  const q = f.search.trim().toLowerCase();
  const filtered = tasks.filter((t) => {
    if (f.classId !== 'all' && (t.classId ?? 'none') !== f.classId) return false;
    if (f.type !== 'all' && t.type !== f.type) return false;
    if (f.status !== 'all' && t.status !== f.status) return false;
    if (
      f.priority !== 'all' &&
      (t.status === 'done' || computePriority(t, now).level !== f.priority)
    )
      return false;
    if (q && !`${t.title} ${t.description}`.toLowerCase().includes(q)) return false;
    return true;
  });
  return sortTasks(filtered, f.sort, now);
}
