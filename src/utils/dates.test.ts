import { describe, expect, it } from 'vitest';
import { completionStreak, dueGroupFor, groupTasksByDue, moveToDay, weeklyProgress } from './dates';
import { suggestStudyBlocks } from './studyPlan';
import { buildMailto } from './mailto';
import type { Task, TaskStatus } from '@/types';

// Wednesday, March 11 2026, 10:00 local time
const NOW = new Date(2026, 2, 11, 10, 0);
const at = (dayOffset: number, hour = 12) =>
  new Date(2026, 2, 11 + dayOffset, hour, 0).toISOString();
const t = (dueAt: string, status: TaskStatus = 'todo') => ({ dueAt, status });

describe('dueGroupFor', () => {
  it('classifies overdue tasks', () => {
    expect(dueGroupFor(t(at(-1)), NOW)).toBe('overdue');
    expect(dueGroupFor(t(at(0, 8)), NOW)).toBe('overdue');
  });
  it('does not mark completed past tasks as overdue', () => {
    expect(dueGroupFor(t(at(-1), 'done'), NOW)).not.toBe('overdue');
  });
  it('classifies today and tomorrow', () => {
    expect(dueGroupFor(t(at(0, 18)), NOW)).toBe('today');
    expect(dueGroupFor(t(at(1)), NOW)).toBe('tomorrow');
  });
  it('classifies this week and later', () => {
    expect(dueGroupFor(t(at(3)), NOW)).toBe('thisWeek');
    expect(dueGroupFor(t(at(20)), NOW)).toBe('later');
  });
});

describe('groupTasksByDue', () => {
  it('buckets every task exactly once', () => {
    const tasks = [t(at(-2)), t(at(0, 20)), t(at(1)), t(at(4)), t(at(30))];
    const groups = groupTasksByDue(tasks, NOW);
    expect(groups.overdue).toHaveLength(1);
    expect(groups.today).toHaveLength(1);
    expect(groups.tomorrow).toHaveLength(1);
    expect(groups.thisWeek).toHaveLength(1);
    expect(groups.later).toHaveLength(1);
  });
});

describe('completionStreak', () => {
  it('counts consecutive days including today', () => {
    const tasks = [0, -1, -2].map((d) => ({ completedAt: at(d, 9) }));
    expect(completionStreak(tasks, NOW)).toBe(3);
  });
  it('continues from yesterday when nothing is done yet today', () => {
    const tasks = [-1, -2].map((d) => ({ completedAt: at(d) }));
    expect(completionStreak(tasks, NOW)).toBe(2);
  });
  it('breaks on a gap', () => {
    const tasks = [0, -2].map((d) => ({ completedAt: at(d, 9) }));
    expect(completionStreak(tasks, NOW)).toBe(1);
  });
});

describe('weeklyProgress', () => {
  it('counts tasks due in the current week', () => {
    const tasks = [t(at(0), 'done'), t(at(1)), t(at(14))];
    expect(weeklyProgress(tasks, NOW, 1)).toEqual({ done: 1, total: 2 });
  });
});

describe('moveToDay', () => {
  it('keeps the time of day', () => {
    const moved = new Date(moveToDay(at(0, 15), new Date(2026, 2, 20)));
    expect(moved.getDate()).toBe(20);
    expect(moved.getHours()).toBe(15);
  });
});

describe('suggestStudyBlocks', () => {
  const base: Task = {
    id: 'x',
    title: 'Chem test',
    description: '',
    classId: null,
    type: 'test',
    dueAt: at(5),
    estimatedMinutes: 120,
    importance: 'high',
    status: 'todo',
    subtasks: [],
    links: [],
    createdAt: NOW.toISOString(),
    completedAt: null,
    quadrantOverride: null,
  };
  it('splits into blocks before the due date', () => {
    const blocks = suggestStudyBlocks(base, NOW);
    expect(blocks.length).toBe(3);
    for (const b of blocks) expect(b.date.getTime()).toBeLessThan(new Date(base.dueAt).getTime());
  });
  it('ignores homework', () => {
    expect(suggestStudyBlocks({ ...base, type: 'homework' }, NOW)).toEqual([]);
  });
});

describe('buildMailto', () => {
  it('encodes subject with class and topic', () => {
    const url = buildMailto({ to: 'a@b.edu', className: 'Biology', topic: 'Lab 3' });
    expect(url).toBe('mailto:a@b.edu?subject=Biology%20%E2%80%94%20Lab%203');
  });
});
