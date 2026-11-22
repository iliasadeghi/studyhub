import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MoreHorizontal, Search, Users } from 'lucide-react';
import type { UserRole } from '@/types';
import { adminService, type AdminUser, type UserDetail } from '@/services/admin';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Field';
import { Menu } from '@/components/ui/Menu';
import { Modal } from '@/components/ui/Modal';
import { Avatar, EmptyState, PageHeader, Skeleton } from '@/components/ui/Misc';
import { Button } from '@/components/ui/Button';
import { pluralize } from '@/utils/format';
import { ROLE_LABEL, filterUsers, statusBadge, type UserFilter } from './adminUtils';
import { ago, useAdminData } from './adminHooks';
import { ListSkeleton, LoadError } from './shared';
import { useUserActions } from './userActions';

const ROLES = ['all', 'student', 'teacher', 'admin'] as const;
const STATUSES = ['all', 'active', 'pending', 'suspended', 'archived'] as const;
const STATUS_LABEL: Record<(typeof STATUSES)[number], string> = {
  all: 'Any status',
  active: 'Active',
  pending: 'Awaiting approval',
  suspended: 'Suspended',
  archived: 'Archived',
};

function pick<T extends string>(value: string | null, options: readonly T[], fallback: T): T {
  return options.includes(value as T) ? (value as T) : fallback;
}

function UserDetailModal({
  user,
  onClose,
  actions,
}: {
  user: AdminUser | null;
  onClose: () => void;
  actions: (u: AdminUser) => { label: string; onSelect: () => void; danger?: boolean }[];
}) {
  const [detail, setDetail] = useState<{ id: string; data: UserDetail } | null>(null);
  const [error, setError] = useState<{ id: string; message: string } | null>(null);
  const id = user?.id;

  useEffect(() => {
    if (!id) return;
    let live = true;
    adminService
      .userDetail(id)
      .then((data) => live && setDetail({ id, data }))
      .catch(
        (err: unknown) =>
          live && setError({ id, message: err instanceof Error ? err.message : 'Failed to load' }),
      );
    return () => {
      live = false;
    };
  }, [id]);
  const d = detail && detail.id === id ? detail.data : null;
  const errorText = error && error.id === id ? error.message : '';

  return (
    <Modal
      open={user !== null}
      onClose={onClose}
      title={user?.name ?? 'User'}
      description={user?.email}
    >
      {user && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <Avatar name={user.name} color={user.avatarColor} size="lg" />
            <div className="flex flex-wrap gap-2">
              <Badge tone={user.role === 'teacher' ? 'info' : 'neutral'}>
                {ROLE_LABEL[user.role]}
                {user.grade && user.role === 'student' ? ` · Grade ${user.grade}` : ''}
              </Badge>
              <Badge tone={statusBadge(user).tone}>{statusBadge(user).label}</Badge>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            {[
              ['Joined', ago(user.createdAt)],
              ['Last sign-in', ago(user.lastSignInAt)],
              ['Email confirmed', user.emailConfirmed ? 'Yes' : 'Not yet'],
              ['Tasks', d ? `${d.tasks_done}/${d.tasks} done` : null],
              ['Conversations', d ? String(d.conversations) : null],
              ['Messages sent', d ? String(d.messages_sent) : null],
            ].map(([label, value]) => (
              <div key={label} className="rounded-md bg-surface-2 px-3 py-2">
                <dt className="text-xs text-muted">{label}</dt>
                <dd className="font-semibold">{value ?? <Skeleton className="mt-1 h-4 w-12" />}</dd>
              </div>
            ))}
          </dl>
          {errorText && <p className="text-sm text-danger-text">{errorText}</p>}
          {d && (d.teaches.length > 0 || d.enrolled.length > 0) && (
            <div>
              <p className="mb-2 text-sm font-semibold">
                {d.teaches.length ? 'Teaches' : 'Enrolled in'}
              </p>
              <div className="flex flex-wrap gap-2">
                {[...d.teaches, ...d.enrolled].map((c) => (
                  <Badge key={c.id} tone={c.archived ? 'neutral' : 'accent'}>
                    {c.name}
                    {c.archived ? ' (archived)' : ''}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          <p className="text-xs text-muted">
            For privacy, you see counts only. Students’ tasks and private notes stay private.
          </p>
          {user.role !== 'admin' && (
            <div className="flex flex-wrap gap-2 border-t border-border pt-4">
              {actions(user).map((a) => (
                <Button
                  key={a.label}
                  size="sm"
                  variant={a.danger ? 'secondary' : 'soft'}
                  className={a.danger ? 'text-danger-text' : undefined}
                  onClick={() => {
                    onClose();
                    a.onSelect();
                  }}
                >
                  {a.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

export default function AdminUsersPage() {
  const [params, setParams] = useSearchParams();
  const { data, error, loading, reload } = useAdminData(adminService.listUsers);
  const [openUser, setOpenUser] = useState<AdminUser | null>(null);
  const { itemsFor, dialog } = useUserActions(() => void reload());

  const filter: UserFilter = {
    query: params.get('q') ?? '',
    role: pick(params.get('role'), ROLES, 'all') as UserRole | 'all',
    status: pick(params.get('status'), STATUSES, 'all'),
  };
  const setFilter = (key: 'q' | 'role' | 'status', value: string) => {
    const next = new URLSearchParams(params);
    if (!value || value === 'all') next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  const users = useMemo(
    () => (data ? filterUsers(data, filter) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- filter is derived from params
    [data, params],
  );

  return (
    <>
      <PageHeader
        title="Users"
        description="Approve teachers, change roles, suspend or archive accounts."
      />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <Input
            aria-label="Search users"
            placeholder="Search by name or email"
            value={filter.query}
            onChange={(e) => setFilter('q', e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          aria-label="Filter by role"
          value={filter.role}
          onChange={(e) => setFilter('role', e.target.value)}
          className="sm:w-40"
        >
          <option value="all">All roles</option>
          <option value="student">Students</option>
          <option value="teacher">Teachers</option>
          <option value="admin">Admin</option>
        </Select>
        <Select
          aria-label="Filter by status"
          value={filter.status}
          onChange={(e) => setFilter('status', e.target.value)}
          className="sm:w-48"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </Select>
      </div>

      {error && !data ? (
        <LoadError message={error} onRetry={() => void reload()} />
      ) : !data || (loading && !data) ? (
        <ListSkeleton />
      ) : users.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Users className="h-6 w-6" aria-hidden />}
            title="No matching users"
            description="Try a different search or filter."
          />
        </Card>
      ) : (
        <Card padded={false}>
          <p className="border-b border-border px-4 py-2.5 text-xs font-semibold text-muted">
            {pluralize(users.length, 'account')}
          </p>
          <ul className="divide-y divide-border">
            {users.map((u) => {
              const badge = statusBadge(u);
              const items = itemsFor(u);
              return (
                <li key={u.id} className="flex items-center gap-3 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setOpenUser(u)}
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-md text-left"
                  >
                    <Avatar name={u.name} color={u.avatarColor} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">
                        {u.name}
                        {u.role === 'admin' && <span className="text-muted"> (you)</span>}
                      </span>
                      <span className="block truncate text-xs text-muted">{u.email}</span>
                    </span>
                  </button>
                  <div className="hidden w-44 shrink-0 text-xs text-muted md:block">
                    {pluralize(u.classCount, 'class', 'classes')} · seen{' '}
                    {ago(u.lastSignInAt, 'never')}
                  </div>
                  <Badge
                    tone={u.role === 'teacher' ? 'info' : u.role === 'admin' ? 'accent' : 'neutral'}
                    className="hidden sm:inline-flex"
                  >
                    {ROLE_LABEL[u.role]}
                  </Badge>
                  <Badge tone={badge.tone}>{badge.label}</Badge>
                  {items.length > 0 ? (
                    <Menu
                      items={items}
                      trigger={(props) => (
                        <button
                          type="button"
                          {...props}
                          aria-label={`Actions for ${u.name}`}
                          className="grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-fg"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      )}
                    />
                  ) : (
                    <span className="w-8" />
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      )}
      <UserDetailModal user={openUser} onClose={() => setOpenUser(null)} actions={itemsFor} />
      {dialog}
    </>
  );
}
