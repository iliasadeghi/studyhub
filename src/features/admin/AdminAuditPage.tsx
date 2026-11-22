import { useState } from 'react';
import { format } from 'date-fns';
import { ScrollText } from 'lucide-react';
import { adminService } from '@/services/admin';
import { Card } from '@/components/ui/Card';
import { EmptyState, PageHeader } from '@/components/ui/Misc';
import { Tabs } from '@/components/ui/Tabs';
import { AUDIT_GROUPS, describeAudit, inAuditGroup, type AuditGroup } from './adminUtils';
import { useAdminData } from './adminHooks';
import { ListSkeleton, LoadError } from './shared';

export default function AdminAuditPage() {
  const { data, error, loading, reload } = useAdminData(() => adminService.auditLog(500));
  const [group, setGroup] = useState<AuditGroup>('all');
  const entries = (data ?? []).filter((e) => inAuditGroup(e, group));

  return (
    <>
      <PageHeader
        title="Audit log"
        description="Every admin action, including each time a conversation was viewed. Entries can't be edited or deleted."
      />
      <Tabs
        label="Filter audit log"
        items={AUDIT_GROUPS.map((g) => ({ id: g.id, label: g.label }))}
        value={group}
        onChange={setGroup}
        layoutId="audit-tabs"
        className="mb-4"
      />
      {error && !data ? (
        <LoadError message={error} onRetry={() => void reload()} />
      ) : !data || (loading && !data) ? (
        <ListSkeleton />
      ) : entries.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ScrollText className="h-6 w-6" aria-hidden />}
            title="Nothing here yet"
            description="Admin actions appear here as they happen."
          />
        </Card>
      ) : (
        <Card padded={false}>
          <ol className="divide-y divide-border">
            {entries.map((e) => (
              <li
                key={e.id}
                className="flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:items-baseline sm:gap-4"
              >
                <time
                  dateTime={e.createdAt}
                  className="shrink-0 text-xs text-muted tabular-nums sm:w-40"
                >
                  {format(new Date(e.createdAt), 'MMM d, yyyy · h:mm a')}
                </time>
                <span className="min-w-0 text-sm">{describeAudit(e)}</span>
              </li>
            ))}
          </ol>
        </Card>
      )}
    </>
  );
}
