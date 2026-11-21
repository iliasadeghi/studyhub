import { Link } from 'react-router-dom';
import { formatDistanceToNowStrict } from 'date-fns';
import { BookOpenText, MessageCircle } from 'lucide-react';
import type { ClassItem } from '@/types';
import { useNoteStore } from '@/stores/noteStore';
import { useTeacherStore } from '@/stores/teacherStore';
import { subjectVars } from '@/utils/colors';
import { Card, CardHeader } from '@/components/ui/Card';
import { Avatar, EmptyState } from '@/components/ui/Misc';

export function RecentNotesCard({ classMap }: { classMap: Record<string, ClassItem> }) {
  const notes = useNoteStore((s) => s.notes);
  const lastViewed = useNoteStore((s) => s.lastViewed);
  const recent = notes
    .filter((n) => lastViewed[n.id])
    .sort((a, b) => lastViewed[b.id].localeCompare(lastViewed[a.id]))
    .slice(0, 4);

  return (
    <Card>
      <CardHeader
        title="Recent notes"
        icon={<BookOpenText className="h-4 w-4" />}
        action={
          <Link
            to="/notes"
            className="rounded-sm px-2 py-1 text-xs font-semibold text-accent-text hover:bg-accent-soft"
          >
            All notes
          </Link>
        }
      />
      {recent.length === 0 ? (
        <EmptyState
          compact
          icon={<BookOpenText className="h-6 w-6" />}
          title="No notes opened yet"
          description="Notes you read will show up here."
        />
      ) : (
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {recent.map((n) => {
            const cls = classMap[n.classId];
            return (
              <li key={n.id}>
                <Link
                  to={`/notes/${n.id}`}
                  className="flex h-full flex-col gap-1 rounded-md border border-border p-3 transition-colors hover:border-border-strong hover:bg-surface-2"
                >
                  <span
                    className="flex items-center gap-1.5 text-xs font-semibold"
                    style={cls ? { color: subjectVars(cls.color).text } : undefined}
                  >
                    <span
                      aria-hidden
                      className="h-1.5 w-1.5 rounded-full"
                      style={cls ? { background: subjectVars(cls.color).solid } : undefined}
                    />
                    {cls?.name ?? 'Unsorted'}
                  </span>
                  <span className="line-clamp-2 text-sm font-semibold">{n.title}</span>
                  <span className="mt-auto text-xs text-muted">
                    Viewed{' '}
                    {formatDistanceToNowStrict(new Date(lastViewed[n.id]), { addSuffix: true })}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

export function RecentMessagesCard() {
  const messages = useTeacherStore((s) => s.messages);
  const teachers = useTeacherStore((s) => s.teachers);
  const latest = teachers
    .map((t) => {
      const thread = messages.filter((m) => m.teacherId === t.id);
      return {
        teacher: t,
        last: thread[thread.length - 1],
        unread: thread.filter((m) => !m.read).length,
      };
    })
    .filter((x) => x.last)
    .sort((a, b) => b.last.sentAt.localeCompare(a.last.sentAt))
    .slice(0, 3);

  return (
    <Card>
      <CardHeader
        title="Messages"
        icon={<MessageCircle className="h-4 w-4" />}
        action={
          <Link
            to="/teachers"
            className="rounded-sm px-2 py-1 text-xs font-semibold text-accent-text hover:bg-accent-soft"
          >
            Teachers
          </Link>
        }
      />
      {latest.length === 0 ? (
        <EmptyState
          compact
          icon={<MessageCircle className="h-6 w-6" />}
          title="No messages yet"
          description="Questions for a teacher? Start a conversation from the Teachers page."
        />
      ) : (
        <ul className="-mx-2 space-y-1">
          {latest.map(({ teacher, last, unread }) => (
            <li key={teacher.id}>
              <Link
                to={`/teachers/${teacher.id}`}
                className="flex items-center gap-3 rounded-md p-2 hover:bg-surface-2"
              >
                <Avatar name={teacher.name} color="purple" size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate font-semibold">{teacher.name}</span>
                    <span className="shrink-0 text-xs text-muted">
                      {formatDistanceToNowStrict(new Date(last.sentAt), { addSuffix: true })}
                    </span>
                  </p>
                  <p className="truncate text-xs text-muted">
                    {last.from === 'student' ? 'You: ' : ''}
                    {last.body}
                  </p>
                </div>
                {unread > 0 && (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-accent-fg">
                    {unread}
                    <span className="sr-only"> unread</span>
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
