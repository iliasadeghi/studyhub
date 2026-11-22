import { describe, expect, it } from 'vitest';
import type { AdminUser } from '@/services/admin';
import { profileFromRow } from '@/services/rows';
import { accessFor, describeAudit, filterUsers, inAuditGroup, statusBadge } from './adminUtils';

const user = (over: Partial<AdminUser>): AdminUser => ({
  id: 'u',
  email: 'u@school.test',
  fullName: 'U',
  name: 'U',
  role: 'student',
  status: 'active',
  grade: null,
  avatarColor: 'blue',
  createdAt: '2026-11-01T00:00:00Z',
  archivedAt: null,
  lastSignInAt: null,
  emailConfirmed: true,
  classCount: 0,
  ...over,
});

const users = [
  user({ id: '1', name: 'Ava Lee', email: 'ava@school.test' }),
  user({
    id: '2',
    name: 'Mr. Park',
    email: 'park@school.test',
    role: 'teacher',
    status: 'pending',
  }),
  user({ id: '3', name: 'Sam Roy', email: 'sam@school.test', status: 'suspended' }),
  user({
    id: '4',
    name: 'Old Account',
    email: 'old@school.test',
    archivedAt: '2026-11-10T00:00:00Z',
  }),
];

describe('accessFor', () => {
  it('lets active accounts in and explains the rest', () => {
    expect(accessFor({ status: 'active', archivedAt: null })).toBe('ok');
    expect(accessFor({ status: 'pending', archivedAt: null })).toBe('pending');
    expect(accessFor({ status: 'suspended', archivedAt: null })).toBe('suspended');
    expect(accessFor({ status: 'active', archivedAt: '2026-11-01' })).toBe('archived');
  });

  it('treats profiles from before the admin migration as active', () => {
    const p = profileFromRow({
      id: 'x',
      email: 'x@y.z',
      full_name: 'X',
      role: 'student',
      grade: null,
      avatar_color: 'blue',
      bio: '',
      preferred_contact: 'message',
      onboarded: true,
    });
    expect(accessFor(p)).toBe('ok');
  });
});

describe('filterUsers', () => {
  const all = { query: '', role: 'all', status: 'all' } as const;

  it('searches by name and email', () => {
    expect(filterUsers(users, { ...all, query: 'ava' }).map((u) => u.id)).toEqual(['1']);
    expect(filterUsers(users, { ...all, query: 'PARK@' }).map((u) => u.id)).toEqual(['2']);
  });

  it('filters by role and status, with archived as its own bucket', () => {
    expect(filterUsers(users, { ...all, role: 'teacher' }).map((u) => u.id)).toEqual(['2']);
    expect(filterUsers(users, { ...all, status: 'pending' }).map((u) => u.id)).toEqual(['2']);
    expect(filterUsers(users, { ...all, status: 'active' }).map((u) => u.id)).toEqual(['1']);
    expect(filterUsers(users, { ...all, status: 'archived' }).map((u) => u.id)).toEqual(['4']);
  });
});

describe('statusBadge', () => {
  it('prioritises archived, then status, then email confirmation', () => {
    expect(statusBadge(users[3]).label).toBe('Archived');
    expect(statusBadge(users[1]).tone).toBe('warning');
    expect(statusBadge(users[2]).tone).toBe('danger');
    expect(statusBadge(user({ emailConfirmed: false })).label).toBe('Unconfirmed email');
    expect(statusBadge(users[0]).label).toBe('Active');
  });
});

describe('describeAudit', () => {
  it('reads like a sentence', () => {
    expect(describeAudit({ action: 'user.approved', targetLabel: 'Mr. Park', details: {} })).toBe(
      'Approved Mr. Park',
    );
    expect(
      describeAudit({
        action: 'class.reassigned',
        targetLabel: 'Chemistry',
        details: { from: 'A', to: 'B' },
      }),
    ).toBe('Moved Chemistry from A to B');
    expect(
      describeAudit({
        action: 'settings.updated',
        targetLabel: 'StudyHub',
        details: { school_name: 'X', features: {} },
      }),
    ).toBe('Updated school settings (school name, features)');
    expect(
      describeAudit({ action: 'conversation.viewed', targetLabel: 'A ↔ B', details: {} }),
    ).toBe('Viewed the conversation A ↔ B');
  });

  it('groups actions for filtering', () => {
    expect(inAuditGroup({ action: 'class.archived' }, 'class')).toBe(true);
    expect(inAuditGroup({ action: 'class.archived' }, 'user')).toBe(false);
    expect(inAuditGroup({ action: 'settings.updated' }, 'all')).toBe(true);
  });
});
