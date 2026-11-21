import { describe, expect, it } from 'vitest';
import {
  computePriority,
  dueProximityScore,
  levelFromScore,
  quadrantFor,
  rankTasks,
} from './priority';
import type { Task } from '@/types';

const NOW = new Date('2026-03-10T12:00:00');
const hours = (h: number) => new Date(NOW.getTime() + h * 3600_000).toISOString();

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: 't',
    title: 'Task',
    description: '',
    classId: null,
    type: 'homework',
    dueAt: hours(72),
    estimatedMinutes: 30,
    importance: 'medium',
    status: 'todo',
    subtasks: [],
    links: [],
    createdAt: NOW.toISOString(),
    completedAt: null,
    quadrantOverride: null,
    ...overrides,
  };
}

describe('dueProximityScore', () => {
  it('gives max points to overdue tasks', () => {
    expect(dueProximityScore(hours(-1), NOW)).toBe(45);
  });
  it('gives high points within 24h', () => {
    expect(dueProximityScore(hours(5), NOW)).toBe(40);
  });
  it('decays to zero at two weeks', () => {
    expect(dueProximityScore(hours(24 * 14), NOW)).toBe(0);
    expect(dueProximityScore(hours(24 * 30), NOW)).toBe(0);
  });
  it('decreases as the due date gets further away', () => {
    expect(dueProximityScore(hours(48), NOW)).toBeGreaterThan(
      dueProximityScore(hours(24 * 7), NOW),
    );
  });
});

describe('computePriority', () => {
  it('scores completed tasks as 0 / low', () => {
    const r = computePriority(task({ status: 'done' }), NOW);
    expect(r.score).toBe(0);
    expect(r.level).toBe('low');
  });

  it('ranks a test above homework with the same due date and importance', () => {
    const test = computePriority(task({ type: 'test' }), NOW);
    const hw = computePriority(task({ type: 'homework' }), NOW);
    expect(test.score).toBeGreaterThan(hw.score);
  });

  it('weights test > project > homework > reading', () => {
    const s = (type: Task['type']) => computePriority(task({ type }), NOW).score;
    expect(s('test')).toBeGreaterThan(s('project'));
    expect(s('project')).toBeGreaterThan(s('homework'));
    expect(s('homework')).toBeGreaterThan(s('reading'));
  });

  it('marks an overdue, high-importance test as critical', () => {
    const r = computePriority(
      task({ type: 'test', importance: 'high', dueAt: hours(-2), estimatedMinutes: 90 }),
      NOW,
    );
    expect(r.level).toBe('critical');
    expect(r.reasons).toContain('Overdue');
  });

  it('marks far-away, low-importance reading as low', () => {
    const r = computePriority(
      task({ type: 'reading', importance: 'low', dueAt: hours(24 * 20), estimatedMinutes: 15 }),
      NOW,
    );
    expect(r.level).toBe('low');
  });

  it('never exceeds 100', () => {
    const r = computePriority(
      task({ type: 'test', importance: 'high', dueAt: hours(-50), estimatedMinutes: 600 }),
      NOW,
    );
    expect(r.score).toBeLessThanOrEqual(100);
  });
});

describe('levelFromScore', () => {
  it('maps thresholds', () => {
    expect(levelFromScore(85)).toBe('critical');
    expect(levelFromScore(55)).toBe('high');
    expect(levelFromScore(35)).toBe('medium');
    expect(levelFromScore(10)).toBe('low');
  });
});

describe('quadrantFor', () => {
  it('puts urgent important tasks in "do"', () => {
    expect(quadrantFor(task({ dueAt: hours(10), importance: 'high' }), NOW)).toBe('do');
  });
  it('puts non-urgent tests in "schedule"', () => {
    expect(quadrantFor(task({ dueAt: hours(24 * 6), type: 'test', importance: 'low' }), NOW)).toBe(
      'schedule',
    );
  });
  it('puts urgent low-importance homework in "delegate"', () => {
    expect(quadrantFor(task({ dueAt: hours(5), importance: 'low' }), NOW)).toBe('delegate');
  });
  it('respects manual overrides', () => {
    expect(quadrantFor(task({ dueAt: hours(5), quadrantOverride: 'eliminate' }), NOW)).toBe(
      'eliminate',
    );
  });
});

describe('rankTasks', () => {
  it('excludes done tasks and sorts by score', () => {
    const a = task({ id: 'a', type: 'reading', dueAt: hours(24 * 10) });
    const b = task({ id: 'b', type: 'test', importance: 'high', dueAt: hours(20) });
    const c = task({ id: 'c', status: 'done' });
    expect(rankTasks([a, b, c], NOW).map((t) => t.id)).toEqual(['b', 'a']);
  });
});
