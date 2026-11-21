import type { Importance, PriorityLevel, Quadrant, Task, TaskType } from '@/types';

const HOUR = 60 * 60 * 1000;

export const TYPE_WEIGHT: Record<TaskType, number> = {
  test: 20,
  project: 16,
  quiz: 14,
  homework: 10,
  reading: 6,
  personal: 4,
};

export const IMPORTANCE_WEIGHT: Record<Importance, number> = {
  low: 5,
  medium: 15,
  high: 25,
};

export interface PriorityResult {
  score: number;
  level: PriorityLevel;
  reasons: string[];
}

type PriorityInput = Pick<Task, 'dueAt' | 'importance' | 'type' | 'estimatedMinutes' | 'status'>;

/** Points (0–45) for how close the due date is. */
export function dueProximityScore(dueAt: string, now: Date): number {
  const hoursLeft = (new Date(dueAt).getTime() - now.getTime()) / HOUR;
  if (hoursLeft < 0) return 45;
  if (hoursLeft <= 24) return 40;
  const maxHours = 14 * 24;
  if (hoursLeft >= maxHours) return 0;
  // Linear decay from 36 (just over a day) to 0 (two weeks out).
  return Math.round(36 * (1 - (hoursLeft - 24) / (maxHours - 24)));
}

/** Points (0–10) for effort; big tasks need to be started earlier. */
export function effortScore(minutes: number, hoursLeft: number): number {
  let base = 0;
  if (minutes >= 120) base = 10;
  else if (minutes >= 60) base = 6;
  else if (minutes >= 30) base = 3;
  // Long tasks due soon are extra pressing.
  const soonBoost = hoursLeft >= 0 && hoursLeft <= 72 && minutes >= 60 ? 1.2 : 1;
  return Math.min(10, Math.round(base * soonBoost));
}

export function levelFromScore(score: number): PriorityLevel {
  if (score >= 70) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

export function computePriority(task: PriorityInput, now: Date = new Date()): PriorityResult {
  if (task.status === 'done') {
    return { score: 0, level: 'low', reasons: ['Completed'] };
  }
  const hoursLeft = (new Date(task.dueAt).getTime() - now.getTime()) / HOUR;
  const due = dueProximityScore(task.dueAt, now);
  const importance = IMPORTANCE_WEIGHT[task.importance];
  const type = TYPE_WEIGHT[task.type];
  const effort = effortScore(task.estimatedMinutes, hoursLeft);
  const score = Math.max(0, Math.min(100, due + importance + type + effort));

  const reasons: string[] = [];
  if (hoursLeft < 0) reasons.push('Overdue');
  else if (hoursLeft <= 24) reasons.push('Due within 24 hours');
  else if (hoursLeft <= 14 * 24) reasons.push(`Due in ${Math.ceil(hoursLeft / 24)} days`);
  else reasons.push('Due date is far away');
  reasons.push(`${capitalize(task.importance)} importance`);
  if (type >= 14) reasons.push(`${capitalize(task.type)}s weigh heavily`);
  if (task.estimatedMinutes >= 60) reasons.push('Takes over an hour');

  return { score, level: levelFromScore(score), reasons };
}

export function isUrgent(task: Pick<Task, 'dueAt'>, now: Date = new Date()): boolean {
  return new Date(task.dueAt).getTime() - now.getTime() <= 48 * HOUR;
}

export function isImportant(task: Pick<Task, 'importance' | 'type'>): boolean {
  return task.importance === 'high' || task.type === 'test' || task.type === 'project';
}

export function quadrantFor(
  task: Pick<Task, 'dueAt' | 'importance' | 'type' | 'quadrantOverride'>,
  now: Date = new Date(),
): Quadrant {
  if (task.quadrantOverride) return task.quadrantOverride;
  const urgent = isUrgent(task, now);
  const important = isImportant(task);
  if (urgent && important) return 'do';
  if (important) return 'schedule';
  if (urgent) return 'delegate';
  return 'eliminate';
}

/** Open tasks sorted by score (desc), ties broken by earliest due date. */
export function rankTasks<T extends Task>(tasks: T[], now: Date = new Date()): T[] {
  return tasks
    .filter((t) => t.status !== 'done')
    .map((t) => ({ t, s: computePriority(t, now).score }))
    .sort((a, b) => b.s - a.s || a.t.dueAt.localeCompare(b.t.dueAt))
    .map((x) => x.t);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
