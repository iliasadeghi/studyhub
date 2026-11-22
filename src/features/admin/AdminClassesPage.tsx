import { useEffect, useMemo, useState } from 'react';
import {
  Archive,
  GraduationCap,
  KeyRound,
  Search,
  Settings2,
  UserMinus,
  UserPlus,
} from 'lucide-react';
import {
  adminService,
  type AdminClass,
  type AdminUser,
  type RosterStudent,
} from '@/services/admin';
import { Badge, SubjectTag } from '@/components/ui/Badge';
import { Button, IconButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Field, Input, Select } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { Avatar, EmptyState, PageHeader, Skeleton } from '@/components/ui/Misc';
import { SubjectArt } from '@/features/classes/art/SubjectArt';
import { artBackground } from '@/features/classes/art/pickArt';
import { pluralize } from '@/utils/format';
import { runAction, useAdminData } from './adminHooks';
import { ConfirmModal, ListSkeleton, LoadError } from './shared';

async function loadClasses() {
  const [classes, users] = await Promise.all([
    adminService.listClasses(),
    adminService.listUsers(),
  ]);
  return { classes, users };
}

function ManageClassModal({
  cls,
  users,
  onClose,
  onChanged,
}: {
  cls: AdminClass | null;
  users: AdminUser[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const [roster, setRoster] = useState<{ id: string; list: RosterStudent[] } | null>(null);
  const [teacherId, setTeacherId] = useState('');
  const [addId, setAddId] = useState('');
  const [code, setCode] = useState('');
  const id = cls?.id;

  const loadRoster = (cid: string) =>
    adminService
      .roster(cid)
      .then((list) => setRoster({ id: cid, list }))
      .catch(() => setRoster({ id: cid, list: [] }));

  useEffect(() => {
    if (!id) return;
    void loadRoster(id);
  }, [id]);

  if (!cls) return null;

  const list = roster?.id === cls.id ? roster.list : null;
  const enrolled = new Set(list?.map((s) => s.id));
  const teachers = users.filter(
    (u) => u.role === 'teacher' && !u.archivedAt && u.id !== cls.teacherId,
  );
  const students = users.filter(
    (u) => u.role === 'student' && !u.archivedAt && !enrolled.has(u.id),
  );

  const change = async (run: () => Promise<unknown>, success: string) => {
    if (await runAction(run, success)) {
      onChanged();
      void loadRoster(cls.id);
    }
  };

  return (
    <Modal open onClose={onClose} title={cls.name} description={cls.subject || undefined} size="lg">
      <div className="space-y-6">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border p-4">
            <p className="text-sm font-semibold">Teacher</p>
            <p className="mb-3 text-sm text-muted">{cls.teacherName}</p>
            <Field label="Move to another teacher" hint="The class keeps its students and notes.">
              {(fid) => (
                <div className="flex gap-2">
                  <Select id={fid} value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
                    <option value="">Choose a teacher…</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                        {t.status !== 'active' ? ` (${t.status})` : ''}
                      </option>
                    ))}
                  </Select>
                  <Button
                    variant="secondary"
                    disabled={!teacherId}
                    onClick={() =>
                      void change(
                        () => adminService.reassignClass(cls.id, teacherId),
                        'Class reassigned',
                      ).then(() => setTeacherId(''))
                    }
                  >
                    Move
                  </Button>
                </div>
              )}
            </Field>
          </div>
          <div className="rounded-lg border border-border p-4">
            <p className="text-sm font-semibold">Join code</p>
            <p className="mt-1 mb-3 font-mono text-2xl font-bold tracking-widest">
              {code || cls.joinCode}
            </p>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<KeyRound className="h-4 w-4" aria-hidden />}
              onClick={() =>
                void runAction(async () => {
                  setCode(await adminService.rotateJoinCode(cls.id));
                  onChanged();
                }, 'New join code created')
              }
            >
              Make a new code
            </Button>
            <p className="mt-2 text-xs text-muted">
              The old code stops working. Students already in the class stay in it.
            </p>
          </div>
        </section>

        <section>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <h3 className="font-bold">Students{list ? ` (${list.length})` : ''}</h3>
            <div className="flex gap-2">
              <Select
                aria-label="Student to add"
                value={addId}
                onChange={(e) => setAddId(e.target.value)}
                className="w-56"
              >
                <option value="">Add a student…</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.grade ? ` · Grade ${s.grade}` : ''}
                  </option>
                ))}
              </Select>
              <Button
                variant="secondary"
                disabled={!addId}
                leftIcon={<UserPlus className="h-4 w-4" aria-hidden />}
                onClick={() =>
                  void change(
                    () => adminService.setMember(cls.id, addId, true),
                    'Student added',
                  ).then(() => setAddId(''))
                }
              >
                Add
              </Button>
            </div>
          </div>
          {!list ? (
            <Skeleton className="h-24" />
          ) : list.length === 0 ? (
            <p className="rounded-md bg-surface-2 px-3 py-4 text-center text-sm text-muted">
              No students yet. Share the join code or add students here.
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border">
              {list.map((s) => (
                <li key={s.id} className="flex items-center gap-3 px-3 py-2">
                  <Avatar name={s.name} color={s.avatarColor} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{s.name}</p>
                    <p className="truncate text-xs text-muted">
                      {s.email}
                      {s.grade ? ` · Grade ${s.grade}` : ''}
                    </p>
                  </div>
                  <IconButton
                    label={`Remove ${s.name} from ${cls.name}`}
                    size="sm"
                    onClick={() =>
                      void change(
                        () => adminService.setMember(cls.id, s.id, false),
                        `${s.name} removed`,
                      )
                    }
                  >
                    <UserMinus className="h-4 w-4" />
                  </IconButton>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Modal>
  );
}

export default function AdminClassesPage() {
  const { data, error, loading, reload } = useAdminData(loadClasses);
  const [query, setQuery] = useState('');
  const [managing, setManaging] = useState<string | null>(null);
  const [archiving, setArchiving] = useState<AdminClass | null>(null);

  const classes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data?.classes ?? []).filter(
      (c) =>
        !c.archivedAt &&
        (!q ||
          c.name.toLowerCase().includes(q) ||
          c.subject.toLowerCase().includes(q) ||
          c.teacherName.toLowerCase().includes(q)),
    );
  }, [data, query]);
  const managed = data?.classes.find((c) => c.id === managing) ?? null;

  return (
    <>
      <PageHeader
        title="Classes"
        description="Every class in the school. Reassign teachers, manage rosters and archive old classes."
      />
      <div className="relative mb-4 max-w-md">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted"
          aria-hidden
        />
        <Input
          aria-label="Search classes"
          placeholder="Search by class, subject or teacher"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {error && !data ? (
        <LoadError message={error} onRetry={() => void reload()} />
      ) : !data || (loading && !data) ? (
        <ListSkeleton rows={4} />
      ) : classes.length === 0 ? (
        <Card>
          <EmptyState
            icon={<GraduationCap className="h-6 w-6" aria-hidden />}
            title={query ? 'No matching classes' : 'No classes yet'}
            description={
              query ? 'Try a different search.' : 'Classes appear here when teachers create them.'
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {classes.map((c) => (
            <Card key={c.id} padded={false} className="flex flex-col overflow-hidden">
              <div className="relative h-24" style={artBackground(c.color)}>
                <SubjectArt cls={c} className="absolute inset-0 h-full w-full" />
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="min-w-0 truncate font-bold">{c.name}</h2>
                  <Badge className="font-mono">{c.joinCode}</Badge>
                </div>
                {c.subject && <SubjectTag color={c.color}>{c.subject}</SubjectTag>}
                <p className="text-sm text-muted">
                  {c.teacherName} · {pluralize(c.studentCount, 'student')}
                </p>
                <div className="mt-auto flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="soft"
                    leftIcon={<Settings2 className="h-4 w-4" aria-hidden />}
                    onClick={() => setManaging(c.id)}
                  >
                    Manage
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={<Archive className="h-4 w-4" aria-hidden />}
                    onClick={() => setArchiving(c)}
                  >
                    Archive
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {data && (
        <ManageClassModal
          key={managed?.id ?? 'none'}
          cls={managed}
          users={data.users}
          onClose={() => setManaging(null)}
          onChanged={() => void reload()}
        />
      )}
      <ConfirmModal
        open={archiving !== null}
        title={`Archive ${archiving?.name ?? 'class'}?`}
        body="The class disappears for its teacher and students, and its join code stops working. Nothing is deleted: restore it any time from the Archive."
        confirmLabel="Archive class"
        danger
        onClose={() => setArchiving(null)}
        onConfirm={async () => {
          if (
            archiving &&
            (await runAction(
              () => adminService.archiveClass(archiving.id, true),
              `${archiving.name} archived`,
            ))
          )
            void reload();
        }}
      />
    </>
  );
}
