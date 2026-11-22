import { useState } from 'react';
import { Archive, ArchiveRestore, Trash2 } from 'lucide-react';
import { adminService, type AdminClass, type AdminUser } from '@/services/admin';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Avatar, EmptyState, PageHeader } from '@/components/ui/Misc';
import { pluralize } from '@/utils/format';
import { ROLE_LABEL } from './adminUtils';
import { ago, runAction, useAdminData } from './adminHooks';
import { ConfirmModal, ListSkeleton, LoadError } from './shared';

async function loadArchive() {
  const [classes, users] = await Promise.all([
    adminService.listClasses(),
    adminService.listUsers(),
  ]);
  return {
    classes: classes.filter((c) => c.archivedAt),
    users: users.filter((u) => u.archivedAt),
  };
}

type Deleting = { kind: 'class'; item: AdminClass } | { kind: 'user'; item: AdminUser };

export default function AdminArchivePage() {
  const { data, error, loading, reload } = useAdminData(loadArchive);
  const [deleting, setDeleting] = useState<Deleting | null>(null);

  const act = async (run: () => Promise<unknown>, success: string) => {
    if (await runAction(run, success)) void reload();
  };

  return (
    <>
      <PageHeader
        title="Archive"
        description="Archived classes and accounts are hidden from everyone but you. Restore them, or delete them for good."
      />
      {error && !data ? (
        <LoadError message={error} onRetry={() => void reload()} />
      ) : !data || (loading && !data) ? (
        <ListSkeleton rows={4} />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader
              title="Classes"
              subtitle={pluralize(data.classes.length, 'archived class', 'archived classes')}
              icon={<Archive className="h-4 w-4" aria-hidden />}
            />
            {data.classes.length === 0 ? (
              <EmptyState
                compact
                icon={<Archive className="h-5 w-5" aria-hidden />}
                title="No archived classes"
                description="Archive a class from the Classes page at the end of a term."
              />
            ) : (
              <ul className="divide-y divide-border">
                {data.classes.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center gap-2 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{c.name}</p>
                      <p className="truncate text-xs text-muted">
                        {c.teacherName} · {pluralize(c.studentCount, 'student')} · archived{' '}
                        {ago(c.archivedAt)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="soft"
                      leftIcon={<ArchiveRestore className="h-4 w-4" aria-hidden />}
                      onClick={() =>
                        void act(() => adminService.archiveClass(c.id, false), `${c.name} restored`)
                      }
                    >
                      Restore
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-danger-text"
                      aria-label={`Delete ${c.name} permanently`}
                      onClick={() => setDeleting({ kind: 'class', item: c })}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader
              title="Accounts"
              subtitle={pluralize(data.users.length, 'archived account')}
              icon={<Archive className="h-4 w-4" aria-hidden />}
            />
            {data.users.length === 0 ? (
              <EmptyState
                compact
                icon={<Archive className="h-5 w-5" aria-hidden />}
                title="No archived accounts"
                description="Archive accounts of students who graduated or staff who left."
              />
            ) : (
              <ul className="divide-y divide-border">
                {data.users.map((u) => (
                  <li key={u.id} className="flex flex-wrap items-center gap-2 py-3">
                    <Avatar name={u.name} color={u.avatarColor} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{u.name}</p>
                      <p className="truncate text-xs text-muted">
                        {u.email} · archived {ago(u.archivedAt)}
                      </p>
                    </div>
                    <Badge>{ROLE_LABEL[u.role]}</Badge>
                    <Button
                      size="sm"
                      variant="soft"
                      leftIcon={<ArchiveRestore className="h-4 w-4" aria-hidden />}
                      onClick={() =>
                        void act(() => adminService.archiveUser(u.id, false), `${u.name} restored`)
                      }
                    >
                      Restore
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-danger-text"
                      aria-label={`Delete ${u.name} permanently`}
                      onClick={() => setDeleting({ kind: 'user', item: u })}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
      <ConfirmModal
        open={deleting !== null}
        title={`Delete ${deleting?.item.name ?? ''} permanently?`}
        body={
          deleting?.kind === 'class'
            ? 'The class, its roster and its class notes are deleted for good. Students keep their own tasks. This can’t be undone.'
            : 'The account and everything in it (tasks, notes, messages, bookings) are deleted for good. This can’t be undone.'
        }
        confirmLabel="Delete permanently"
        danger
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          return deleting.kind === 'class'
            ? act(() => adminService.deleteClass(deleting.item.id), `${deleting.item.name} deleted`)
            : act(() => adminService.deleteUser(deleting.item.id), `${deleting.item.name} deleted`);
        }}
      />
    </>
  );
}
