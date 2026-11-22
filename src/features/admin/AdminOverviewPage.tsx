import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  BookOpen,
  GraduationCap,
  Hourglass,
  MessageCircle,
  ScrollText,
  UserPlus,
  Users,
} from 'lucide-react';
import { adminService } from '@/services/admin';
import { useProfile } from '@/stores/authStore';
import { useSchoolName } from '@/stores/schoolStore';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Avatar, EmptyState, PageHeader } from '@/components/ui/Misc';
import { greeting } from '@/utils/dates';
import { ROLE_LABEL, describeAudit } from './adminUtils';
import { ago, runAction, useAdminData } from './adminHooks';
import { ListSkeleton, LoadError, StatCard } from './shared';

async function loadOverview() {
  const [stats, users, audit] = await Promise.all([
    adminService.stats(),
    adminService.listUsers(),
    adminService.auditLog(8),
  ]);
  return { stats, users, audit };
}

export default function AdminOverviewPage() {
  const profile = useProfile();
  const school = useSchoolName();
  const navigate = useNavigate();
  const { data, error, loading, reload } = useAdminData(loadOverview);

  const pending = data?.users.filter((u) => u.status === 'pending' && !u.archivedAt) ?? [];
  const recent = data?.users.filter((u) => u.role !== 'admin').slice(0, 6) ?? [];

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${profile.fullName.split(' ')[0] || 'admin'}`}
        description={`Here's what's happening at ${school}.`}
      />

      {error && !data ? (
        <LoadError message={error} onRetry={() => void reload()} />
      ) : !data || loading ? (
        <ListSkeleton rows={5} />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Students"
              value={data.stats.students}
              icon={<Users className="h-5 w-5" aria-hidden />}
              onClick={() => navigate('/admin/users?role=student')}
            />
            <StatCard
              label="Teachers"
              value={data.stats.teachers}
              icon={<BookOpen className="h-5 w-5" aria-hidden />}
              tone="info"
              onClick={() => navigate('/admin/users?role=teacher')}
            />
            <StatCard
              label="Awaiting approval"
              value={data.stats.pending}
              icon={<Hourglass className="h-5 w-5" aria-hidden />}
              tone="warning"
              onClick={() => navigate('/admin/users?status=pending')}
            />
            <StatCard
              label="Classes"
              value={data.stats.classes}
              hint={`${data.stats.archived_classes} archived`}
              icon={<GraduationCap className="h-5 w-5" aria-hidden />}
              tone="success"
              onClick={() => navigate('/admin/classes')}
            />
            <StatCard
              label="Signed in this week"
              value={data.stats.active_week}
              icon={<Activity className="h-5 w-5" aria-hidden />}
              tone="success"
            />
            <StatCard
              label="New this week"
              value={data.stats.signups_week}
              icon={<UserPlus className="h-5 w-5" aria-hidden />}
              tone="info"
            />
            <StatCard
              label="Messages this week"
              value={data.stats.messages_week}
              icon={<MessageCircle className="h-5 w-5" aria-hidden />}
              onClick={() => navigate('/admin/moderation')}
            />
            <StatCard
              label="Suspended"
              value={data.stats.suspended}
              hint={`${data.stats.archived_users} archived`}
              icon={<Users className="h-5 w-5" aria-hidden />}
              tone="danger"
              onClick={() => navigate('/admin/users?status=suspended')}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader
                title="Teachers awaiting approval"
                icon={<Hourglass className="h-4 w-4" aria-hidden />}
                subtitle="New teachers can't create classes until you approve them."
              />
              {pending.length === 0 ? (
                <EmptyState
                  compact
                  icon={<Hourglass className="h-5 w-5" aria-hidden />}
                  title="All caught up"
                  description="No one is waiting for approval."
                />
              ) : (
                <ul className="divide-y divide-border">
                  {pending.map((u) => (
                    <li key={u.id} className="flex flex-wrap items-center gap-3 py-3">
                      <Avatar name={u.name} color={u.avatarColor} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{u.name}</p>
                        <p className="truncate text-xs text-muted">
                          {u.email} · signed up {ago(u.createdAt)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={async () => {
                          if (
                            await runAction(
                              () => adminService.setStatus(u.id, 'active'),
                              `${u.name} approved`,
                            )
                          )
                            void reload();
                        }}
                      >
                        Approve
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <CardHeader
                title="Recent sign-ups"
                icon={<UserPlus className="h-4 w-4" aria-hidden />}
                action={
                  <Link
                    to="/admin/users"
                    className="text-sm font-semibold text-accent-text hover:underline"
                  >
                    All users
                  </Link>
                }
              />
              {recent.length === 0 ? (
                <EmptyState
                  compact
                  icon={<Users className="h-5 w-5" aria-hidden />}
                  title="No accounts yet"
                  description="Share the sign-up link with your students and teachers."
                />
              ) : (
                <ul className="divide-y divide-border">
                  {recent.map((u) => (
                    <li key={u.id} className="flex items-center gap-3 py-2.5">
                      <Avatar name={u.name} color={u.avatarColor} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{u.name}</p>
                        <p className="truncate text-xs text-muted">{ago(u.createdAt)}</p>
                      </div>
                      <Badge tone={u.role === 'teacher' ? 'info' : 'neutral'}>
                        {ROLE_LABEL[u.role]}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <Card>
            <CardHeader
              title="Latest admin activity"
              icon={<ScrollText className="h-4 w-4" aria-hidden />}
              action={
                <Link
                  to="/admin/audit"
                  className="text-sm font-semibold text-accent-text hover:underline"
                >
                  Audit log
                </Link>
              }
            />
            {data.audit.length === 0 ? (
              <p className="text-sm text-muted">
                Nothing yet. Every admin action is recorded here.
              </p>
            ) : (
              <ul className="space-y-2">
                {data.audit.map((e) => (
                  <li key={e.id} className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate">{describeAudit(e)}</span>
                    <span className="shrink-0 text-xs text-muted">{ago(e.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
