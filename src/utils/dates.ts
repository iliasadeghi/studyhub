import {
  addDays,
  differenceInCalendarDays,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isToday,
  isTomorrow,
  isYesterday,
  startOfDay,
  startOfWeek,
  subDays,
} from 'date-fns';
import type { Task } from '@/types';

export type DueGroup = 'overdue' | 'today' | 'tomorrow' | 'thisWeek' | 'later';

export const DUE_GROUP_LABELS: Record<DueGroup, string> = {
  overdue: 'Overdue',
  today: 'Today',
  tomorrow: 'Tomorrow',
  thisWeek: 'This Week',
  later: 'Later',
};

export const DUE_GROUP_ORDER: DueGroup[] = ['overdue', 'today', 'tomorrow', 'thisWeek', 'later'];

export function isOverdue(task: Pick<Task, 'dueAt' | 'status'>, now: Date = new Date()): boolean {
  return task.status !== 'done' && isBefore(new Date(task.dueAt), now);
}

export function dueGroupFor(
  task: Pick<Task, 'dueAt' | 'status'>,
  now: Date = new Date(),
  weekStartsOn: 0 | 1 = 1,
): DueGroup {
  const due = new Date(task.dueAt);
  if (isOverdue(task, now)) return 'overdue';
  if (isSameDay(due, now)) return 'today';
  if (isSameDay(due, addDays(now, 1))) return 'tomorrow';
  const weekEnd = endOfWeek(now, { weekStartsOn });
  // Always treat at least the next 7 days as "this week" so weekends aren't empty.
  const sevenDays = addDays(startOfDay(now), 7);
  const horizon = weekEnd.getTime() > sevenDays.getTime() ? weekEnd : sevenDays;
  if (due.getTime() <= horizon.getTime()) return 'thisWeek';
  return 'later';
}

export function groupTasksByDue<T extends Pick<Task, 'dueAt' | 'status'>>(
  tasks: T[],
  now: Date = new Date(),
  weekStartsOn: 0 | 1 = 1,
): Record<DueGroup, T[]> {
  const groups: Record<DueGroup, T[]> = {
    overdue: [],
    today: [],
    tomorrow: [],
    thisWeek: [],
    later: [],
  };
  for (const t of tasks) groups[dueGroupFor(t, now, weekStartsOn)].push(t);
  return groups;
}

/** Human-friendly due label, e.g. "Today, 3:30 PM" or "Mon, Nov 24". */
export function formatDue(iso: string, now: Date = new Date()): string {
  const d = new Date(iso);
  const time = format(d, 'h:mm a');
  if (isToday(d)) return `Today, ${time}`;
  if (isTomorrow(d)) return `Tomorrow, ${time}`;
  if (isYesterday(d)) return `Yesterday, ${time}`;
  const diff = differenceInCalendarDays(d, now);
  if (diff > 0 && diff < 7) return `${format(d, 'EEEE')}, ${time}`;
  return format(d, d.getFullYear() === now.getFullYear() ? 'EEE, MMM d' : 'MMM d, yyyy');
}

export function relativeDays(iso: string, now: Date = new Date()): string {
  const diff = differenceInCalendarDays(new Date(iso), now);
  if (diff === 0) return 'today';
  if (diff === 1) return 'tomorrow';
  if (diff === -1) return 'yesterday';
  if (diff < 0) return `${-diff} days ago`;
  return `in ${diff} days`;
}

export function greeting(now: Date = new Date()): string {
  const h = now.getHours();
  if (h < 5) return 'Up late';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/** Consecutive days (ending today, or yesterday if nothing yet today) with a completed task. */
export function completionStreak(
  tasks: Pick<Task, 'completedAt'>[],
  now: Date = new Date(),
): number {
  const days = new Set(
    tasks
      .filter((t) => t.completedAt)
      .map((t) => format(new Date(t.completedAt as string), 'yyyy-MM-dd')),
  );
  let cursor = startOfDay(now);
  if (!days.has(format(cursor, 'yyyy-MM-dd'))) cursor = subDays(cursor, 1);
  let streak = 0;
  while (days.has(format(cursor, 'yyyy-MM-dd'))) {
    streak += 1;
    cursor = subDays(cursor, 1);
  }
  return streak;
}

/** Tasks due this week, and how many of them are done. */
export function weeklyProgress(
  tasks: Pick<Task, 'dueAt' | 'status'>[],
  now: Date = new Date(),
  weekStartsOn: 0 | 1 = 1,
): { done: number; total: number } {
  const start = startOfWeek(now, { weekStartsOn }).getTime();
  const end = endOfWeek(now, { weekStartsOn }).getTime();
  const inWeek = tasks.filter((t) => {
    const due = new Date(t.dueAt).getTime();
    return due >= start && due <= end;
  });
  return { done: inWeek.filter((t) => t.status === 'done').length, total: inWeek.length };
}

/** Combine a date (yyyy-MM-dd) and time (HH:mm) into an ISO string, in local time. */
export function combineDateTime(date: string, time: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm).toISOString();
}

export function toDateInput(iso: string): string {
  return format(new Date(iso), 'yyyy-MM-dd');
}

export function toTimeInput(iso: string): string {
  return format(new Date(iso), 'HH:mm');
}

/** Move an ISO date-time to another day, keeping the time of day. */
export function moveToDay(iso: string, day: Date): string {
  const src = new Date(iso);
  const next = new Date(day);
  next.setHours(src.getHours(), src.getMinutes(), 0, 0);
  return next.toISOString();
}

export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const WEEKDAY_LONG = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export function formatTime12(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  return format(new Date(2000, 0, 1, h, m), m === 0 ? 'h a' : 'h:mm a');
}
