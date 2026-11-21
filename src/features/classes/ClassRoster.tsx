import { Link } from 'react-router-dom';
import { MessageCircle, UserMinus, Users } from 'lucide-react';
import type { Contact } from '@/types';
import { useClassStore } from '@/stores/classStore';
import { useTeacherStore } from '@/stores/teacherStore';
import { useUIStore } from '@/stores/uiStore';
import { Avatar, EmptyState } from '@/components/ui/Misc';
import { IconButton } from '@/components/ui/Button';

/** Teachers: students enrolled in a class. */
export function ClassRoster({
  classId,
  joinCode,
  students,
}: {
  classId: string;
  joinCode: string;
  students: Contact[];
}) {
  const messages = useTeacherStore((s) => s.messages);
  const pushToast = useUIStore((s) => s.pushToast);

  if (students.length === 0) {
    return (
      <EmptyState
        icon={<Users className="h-8 w-8" />}
        title="No students yet"
        description={`Share the join code ${joinCode} with your class. Students appear here as soon as they join.`}
      />
    );
  }

  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-surface shadow-soft">
      {[...students]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((s) => {
          const unread = messages.filter((m) => m.contactId === s.id && !m.mine && !m.read).length;
          return (
            <li key={s.id} className="flex items-center gap-3 px-4 py-3">
              <Avatar name={s.name} color={s.avatarColor} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{s.name}</p>
                <p className="truncate text-xs text-muted">{s.email}</p>
              </div>
              <Link
                to={`/messages/${s.id}`}
                className="relative inline-flex h-9 items-center gap-1.5 rounded-sm border border-border px-3 text-sm font-semibold hover:bg-surface-2"
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">Message</span>
                {unread > 0 && (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-accent-fg">
                    {unread}
                    <span className="sr-only"> unread</span>
                  </span>
                )}
              </Link>
              <IconButton
                size="sm"
                label={`Remove ${s.name} from class`}
                onClick={() => {
                  if (!window.confirm(`Remove ${s.name} from this class?`)) return;
                  useClassStore.getState().removeStudent(classId, s.id);
                  pushToast({ title: 'Student removed', description: s.name });
                }}
                className="hover:text-danger-text"
              >
                <UserMinus className="h-4 w-4" />
              </IconButton>
            </li>
          );
        })}
    </ul>
  );
}
