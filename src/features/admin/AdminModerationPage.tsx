import { useState } from 'react';
import { format } from 'date-fns';
import { Eye, Lock, MessageCircle, Search } from 'lucide-react';
import { adminService, type AdminConversation } from '@/services/admin';
import type { MessageRow } from '@/services/rows';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, PageHeader, Skeleton } from '@/components/ui/Misc';
import { cn } from '@/utils/cn';
import { pluralize } from '@/utils/format';
import { ago, useAdminData } from './adminHooks';
import { ListSkeleton, LoadError } from './shared';

function ConversationViewer({
  conversation,
  onClose,
}: {
  conversation: AdminConversation;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<MessageRow[] | null>(null);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const open = async () => {
    setConfirmed(true);
    try {
      setMessages(await adminService.viewConversation(conversation.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load messages');
    }
  };

  const name = (id: string) =>
    id === conversation.studentId ? conversation.studentName : conversation.teacherName;

  return (
    <Modal
      open
      onClose={onClose}
      title={`${conversation.studentName} ↔ ${conversation.teacherName}`}
      description="Read-only. You can't send or change messages."
      size="lg"
      footer={
        !confirmed ? (
          <>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button leftIcon={<Eye className="h-4 w-4" aria-hidden />} onClick={() => void open()}>
              View messages
            </Button>
          </>
        ) : undefined
      }
    >
      {!confirmed ? (
        <div className="flex items-start gap-3 rounded-lg border border-warning/40 bg-warning-soft p-4 text-sm">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden />
          <p>
            These are private messages between a student and a teacher. Only open them when you have
            a reason to (a safety concern or a complaint). <strong>Your view is recorded</strong> in
            the audit log with the date and time.
          </p>
        </div>
      ) : error ? (
        <p className="text-sm text-danger-text">{error}</p>
      ) : !messages ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-2/3" />
          <Skeleton className="ml-auto h-12 w-1/2" />
          <Skeleton className="h-12 w-3/5" />
        </div>
      ) : messages.length === 0 ? (
        <p className="text-sm text-muted">This conversation has no messages.</p>
      ) : (
        <ol className="max-h-[60vh] space-y-3 overflow-y-auto pr-1" aria-label="Messages">
          {messages.map((m) => {
            const teacher = m.sender_id === conversation.teacherId;
            return (
              <li key={m.id} className={cn('flex flex-col', teacher ? 'items-end' : 'items-start')}>
                <span className="mb-1 text-xs text-muted">
                  {name(m.sender_id)} · {format(new Date(m.created_at), 'MMM d, h:mm a')}
                </span>
                <p
                  className={cn(
                    'max-w-[80%] rounded-lg px-3 py-2 text-sm break-words whitespace-pre-wrap',
                    teacher ? 'bg-accent-soft' : 'bg-surface-2',
                  )}
                >
                  {m.body}
                </p>
              </li>
            );
          })}
        </ol>
      )}
    </Modal>
  );
}

export default function AdminModerationPage() {
  const { data, error, loading, reload } = useAdminData(adminService.listConversations);
  const [query, setQuery] = useState('');
  const [viewing, setViewing] = useState<AdminConversation | null>(null);

  const q = query.trim().toLowerCase();
  const list = (data ?? []).filter(
    (c) => !q || c.studentName.toLowerCase().includes(q) || c.teacherName.toLowerCase().includes(q),
  );

  return (
    <>
      <PageHeader
        title="Moderation"
        description="Who is talking to whom. Message text stays private unless you open a conversation, and every view is logged."
      />
      <div className="relative mb-4 max-w-md">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted"
          aria-hidden
        />
        <Input
          aria-label="Search conversations"
          placeholder="Search by student or teacher"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>
      {error && !data ? (
        <LoadError message={error} onRetry={() => void reload()} />
      ) : !data || (loading && !data) ? (
        <ListSkeleton />
      ) : list.length === 0 ? (
        <Card>
          <EmptyState
            icon={<MessageCircle className="h-6 w-6" aria-hidden />}
            title={q ? 'No matching conversations' : 'No conversations yet'}
            description="Conversations appear when a student and teacher start messaging."
          />
        </Card>
      ) : (
        <Card padded={false}>
          <ul className="divide-y divide-border">
            {list.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {c.studentName} <span className="text-muted">↔</span> {c.teacherName}
                  </p>
                  <p className="text-xs text-muted">
                    {pluralize(c.messageCount, 'message')} · last activity{' '}
                    {ago(c.lastMessageAt, 'none')}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  leftIcon={<Eye className="h-4 w-4" aria-hidden />}
                  onClick={() => setViewing(c)}
                >
                  Open
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}
      {viewing && <ConversationViewer conversation={viewing} onClose={() => setViewing(null)} />}
    </>
  );
}
