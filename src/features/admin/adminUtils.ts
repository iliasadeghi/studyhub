import type { AccountStatus, Profile, UserRole } from '@/types';
import type { AdminUser, AuditEntry } from '@/services/admin';

/** What a signed-in account is allowed to see. */
export type Access = 'ok' | 'pending' | 'suspended' | 'archived';

export function accessFor(profile: Pick<Profile, 'status' | 'archivedAt'>): Access {
  if (profile.archivedAt) return 'archived';
  if (profile.status === 'pending') return 'pending';
  if (profile.status === 'suspended') return 'suspended';
  return 'ok';
}

export const isAdmin = (role: UserRole | undefined) => role === 'admin';

export type UserFilter = {
  query: string;
  role: UserRole | 'all';
  status: AccountStatus | 'archived' | 'all';
};

/** Search by name or email; "archived" is its own status bucket. */
export function filterUsers(users: AdminUser[], f: UserFilter): AdminUser[] {
  const q = f.query.trim().toLowerCase();
  return users.filter((u) => {
    if (f.role !== 'all' && u.role !== f.role) return false;
    if (f.status === 'archived') {
      if (!u.archivedAt) return false;
    } else if (f.status !== 'all') {
      if (u.archivedAt || u.status !== f.status) return false;
    }
    if (!q) return true;
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });
}

export type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';

export function statusBadge(u: Pick<AdminUser, 'status' | 'archivedAt' | 'emailConfirmed'>): {
  label: string;
  tone: Tone;
} {
  if (u.archivedAt) return { label: 'Archived', tone: 'neutral' };
  if (u.status === 'pending') return { label: 'Awaiting approval', tone: 'warning' };
  if (u.status === 'suspended') return { label: 'Suspended', tone: 'danger' };
  if (!u.emailConfirmed) return { label: 'Unconfirmed email', tone: 'info' };
  return { label: 'Active', tone: 'success' };
}

export const ROLE_LABEL: Record<UserRole, string> = {
  student: 'Student',
  teacher: 'Teacher',
  admin: 'Admin',
};

const str = (v: unknown) => (typeof v === 'string' || typeof v === 'number' ? String(v) : '');

/** Plain-English sentence for an audit-log entry. */
export function describeAudit(e: Pick<AuditEntry, 'action' | 'targetLabel' | 'details'>): string {
  const who = e.targetLabel || 'someone';
  const d = e.details;
  switch (e.action) {
    case 'user.approved':
      return `Approved ${who}`;
    case 'user.suspended':
      return `Suspended ${who}`;
    case 'user.reactivated':
      return `Reactivated ${who}`;
    case 'user.status_changed':
      return `Changed ${who}'s status to ${str(d.to)}`;
    case 'user.role_changed':
      return `Changed ${who} from ${str(d.from)} to ${str(d.to)}`;
    case 'user.archived':
      return `Archived ${who}`;
    case 'user.restored':
      return `Restored ${who}`;
    case 'user.deleted':
      return `Permanently deleted ${who}`;
    case 'user.password_reset_sent':
      return `Sent a password-reset email to ${who}`;
    case 'class.archived':
      return `Archived the class ${who}`;
    case 'class.restored':
      return `Restored the class ${who}`;
    case 'class.deleted':
      return `Permanently deleted the class ${who}`;
    case 'class.reassigned':
      return `Moved ${who} from ${str(d.from)} to ${str(d.to)}`;
    case 'class.member_added':
      return `Added ${str(d.student)} to ${who}`;
    case 'class.member_removed':
      return `Removed ${str(d.student)} from ${who}`;
    case 'class.code_rotated':
      return `Changed the join code for ${who}`;
    case 'conversation.viewed':
      return `Viewed the conversation ${who}`;
    case 'settings.updated': {
      const keys = Object.keys(d).map((k) => k.replace(/_/g, ' '));
      return keys.length
        ? `Updated school settings (${keys.join(', ')})`
        : 'Updated school settings';
    }
    default:
      return `${e.action} ${who}`.trim();
  }
}

/** Groups for the audit filter. */
export const AUDIT_GROUPS = [
  { id: 'all', label: 'Everything' },
  { id: 'user', label: 'Accounts' },
  { id: 'class', label: 'Classes' },
  { id: 'conversation', label: 'Message views' },
  { id: 'settings', label: 'Settings' },
] as const;
export type AuditGroup = (typeof AUDIT_GROUPS)[number]['id'];

export const inAuditGroup = (e: Pick<AuditEntry, 'action'>, g: AuditGroup) =>
  g === 'all' || e.action.startsWith(`${g}.`);
