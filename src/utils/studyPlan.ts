import { addDays, differenceInCalendarDays, startOfDay } from 'date-fns';
import type { Task } from '@/types';

export interface StudyBlock {
  taskId: string;
  date: Date;
  minutes: number;
  label: string;
}

const MAX_BLOCK = 45;
const MIN_BLOCK = 20;

/**
 * Break a big task (test/project) into daily study blocks spread evenly across the
 * days from today up to the day before it's due.
 */
export function suggestStudyBlocks(task: Task, now: Date = new Date()): StudyBlock[] {
  if (task.status === 'done' || (task.type !== 'test' && task.type !== 'project')) return [];
  const today = startOfDay(now);
  const due = startOfDay(new Date(task.dueAt));
  const daysAvailable = differenceInCalendarDays(due, today);
  if (daysAvailable < 1) return [];

  const total = Math.max(task.estimatedMinutes, MIN_BLOCK);
  const blocksNeeded = Math.max(1, Math.ceil(total / MAX_BLOCK));
  const blockCount = Math.min(blocksNeeded, daysAvailable);
  const perBlock = Math.max(MIN_BLOCK, Math.round(total / blockCount / 5) * 5);
  const verb = task.type === 'test' ? 'Study' : 'Work on';

  const step = daysAvailable / blockCount;
  const blocks: StudyBlock[] = [];
  for (let i = 0; i < blockCount; i++) {
    const offset = Math.max(0, Math.round(daysAvailable - step * (blockCount - i)));
    blocks.push({
      taskId: task.id,
      date: addDays(today, offset),
      minutes: perBlock,
      label: `${verb}: ${task.title}`,
    });
  }
  return blocks;
}
