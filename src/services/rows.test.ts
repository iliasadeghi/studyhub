import { describe, expect, it } from 'vitest';
import {
  asColor,
  bookingFromRow,
  classFromRow,
  noteFromRow,
  officeHourFromRow,
  taskFromRow,
  taskToRow,
  type TaskRow,
} from './rows';
import { authErrorMessage } from '@/features/auth/authErrors';

const taskRow: TaskRow = {
  id: 't1',
  owner_id: 'u1',
  class_id: 'c1',
  title: 'Lab report',
  description: 'Write it up',
  type: 'homework',
  due_at: '2026-11-25T23:59:00.000Z',
  estimated_minutes: 90,
  importance: 'high',
  status: 'in_progress',
  subtasks: [{ id: 's1', title: 'Graph', done: true }],
  links: [],
  quadrant_override: null,
  completed_at: null,
  created_at: '2026-11-20T10:00:00.000Z',
};

describe('task mapping', () => {
  it('maps a row to a task', () => {
    const t = taskFromRow(taskRow);
    expect(t).toMatchObject({
      id: 't1',
      classId: 'c1',
      dueAt: taskRow.due_at,
      estimatedMinutes: 90,
      status: 'in_progress',
    });
    expect(t.subtasks).toHaveLength(1);
  });

  it('round-trips through taskToRow', () => {
    const row = taskToRow(taskFromRow(taskRow));
    expect(row).toMatchObject({
      id: 't1',
      class_id: 'c1',
      due_at: taskRow.due_at,
      estimated_minutes: 90,
      importance: 'high',
    });
    expect(row).not.toHaveProperty('owner_id'); // owner is set by the database from the session
  });

  it('only includes changed fields in a partial patch', () => {
    expect(taskToRow({ status: 'done', completedAt: '2026-11-21T00:00:00.000Z' })).toEqual({
      status: 'done',
      completed_at: '2026-11-21T00:00:00.000Z',
    });
  });
});

describe('other mappers', () => {
  it('derives note kind from visibility', () => {
    const base = {
      id: 'n',
      class_id: 'c',
      author_id: 'a',
      unit: 'U1',
      title: 'T',
      content: '',
      created_at: '',
      updated_at: '',
    };
    expect(noteFromRow({ ...base, visibility: 'class' }).kind).toBe('teacher');
    expect(noteFromRow({ ...base, visibility: 'private' }).kind).toBe('mine');
  });

  it('maps class rows including the join code', () => {
    const c = classFromRow({
      id: 'c',
      teacher_id: 't',
      name: 'Biology',
      subject: 'Science',
      color: 'green',
      room: 'Lab',
      schedule: { days: [1], start: '09:00', end: '09:50' },
      join_code: 'ABC123',
    });
    expect(c).toMatchObject({ teacherId: 't', color: 'green', joinCode: 'ABC123' });
  });

  it('falls back to blue for unknown colors', () => {
    expect(asColor('magenta')).toBe('blue');
    expect(asColor('rose')).toBe('rose');
  });

  it('trims Postgres time values to HH:mm', () => {
    expect(
      officeHourFromRow({
        id: 'o',
        teacher_id: 't',
        day: 2,
        start_time: '15:15:00',
        end_time: '16:00:00',
        location: 'Room 1',
      }),
    ).toEqual({
      id: 'o',
      day: 2,
      start: '15:15',
      end: '16:00',
      location: 'Room 1',
    });
  });

  it('maps bookings', () => {
    const b = bookingFromRow({
      id: 'b',
      teacher_id: 't',
      student_id: 's',
      starts_at: 'x',
      ends_at: 'y',
      topic: 'Help',
      location: 'R',
      status: 'booked',
    });
    expect(b).toEqual({
      id: 'b',
      teacherId: 't',
      studentId: 's',
      start: 'x',
      end: 'y',
      topic: 'Help',
      location: 'R',
      status: 'booked',
    });
  });
});

describe('authErrorMessage', () => {
  it('rewrites common Supabase errors', () => {
    expect(authErrorMessage('Invalid login credentials')).toMatch(/don’t match/);
    expect(authErrorMessage('Email not confirmed')).toMatch(/confirm your email/);
    expect(authErrorMessage('User already registered')).toMatch(/already exists/);
  });
  it('passes unknown errors through', () => {
    expect(authErrorMessage('Something odd')).toBe('Something odd');
  });
});
