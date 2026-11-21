import { useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { formatDistanceToNowStrict } from 'date-fns';
import { Search } from 'lucide-react';
import type { Contact, Message } from '@/types';
import { useTeacherStore } from '@/stores/teacherStore';
import { cn } from '@/utils/cn';
import { Input } from '@/components/ui/Field';
import { Avatar } from '@/components/ui/Misc';

interface Row {
  contact: Contact;
  last?: Message;
  unread: number;
}

export function ConversationList() {
  const contacts = useTeacherStore((s) => s.teachers);
  const messages = useTeacherStore((s) => s.messages);
  const typing = useTeacherStore((s) => s.typing);
  const [query, setQuery] = useState('');

  const rows = useMemo<Row[]>(() => {
    const q = query.trim().toLowerCase();
    return contacts
      .filter((c) => !q || `${c.name} ${c.subjects.join(' ')}`.toLowerCase().includes(q))
      .map((contact) => {
        const thread = messages.filter((m) => m.contactId === contact.id);
        return {
          contact,
          last: thread[thread.length - 1],
          unread: thread.filter((m) => !m.mine && !m.read).length,
        };
      })
      .sort(
        (a, b) =>
          (b.last?.sentAt ?? '').localeCompare(a.last?.sentAt ?? '') ||
          a.contact.name.localeCompare(b.contact.name),
      );
  }, [contacts, messages, query]);

  const active = rows.filter((r) => r.last);
  const others = rows.filter((r) => !r.last);

  const item = ({ contact, last, unread }: Row) => (
    <li key={contact.id}>
      <NavLink
        to={`/messages/${contact.id}`}
        className={({ isActive }) =>
          cn(
            'flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors',
            isActive ? 'bg-accent-soft' : 'hover:bg-surface-2',
          )
        }
      >
        <Avatar name={contact.name} color={contact.avatarColor} />
        <div className="min-w-0 flex-1">
          <p className="flex items-baseline justify-between gap-2">
            <span className={cn('truncate text-sm', unread ? 'font-bold' : 'font-semibold')}>
              {contact.name}
            </span>
            {last && (
              <span className="shrink-0 text-[11px] text-muted">
                {formatDistanceToNowStrict(new Date(last.sentAt), { addSuffix: false })}
              </span>
            )}
          </p>
          <p className={cn('truncate text-xs', unread ? 'font-semibold text-fg' : 'text-muted')}>
            {typing[contact.id] ? (
              <span className="text-accent-text">typing…</span>
            ) : last ? (
              `${last.mine ? 'You: ' : ''}${last.body}`
            ) : (
              contact.subjects.join(', ') || (contact.role === 'teacher' ? 'Teacher' : 'Student')
            )}
          </p>
        </div>
        {unread > 0 && (
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-accent-fg">
            {unread}
            <span className="sr-only"> unread</span>
          </span>
        )}
      </NavLink>
    </li>
  );

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people…"
            aria-label="Search conversations"
            className="pl-9"
          />
        </div>
      </div>
      <nav aria-label="Conversations" className="scrollbar-thin flex-1 overflow-y-auto p-2">
        {rows.length === 0 && (
          <p className="px-3 py-8 text-center text-sm text-muted">
            {contacts.length === 0
              ? 'Join or create a class to start messaging.'
              : `No one matches “${query}”.`}
          </p>
        )}
        {active.length > 0 && <ul className="space-y-0.5">{active.map(item)}</ul>}
        {others.length > 0 && (
          <>
            <p className="px-3 pt-4 pb-1 text-[11px] font-bold tracking-wide text-subtle uppercase">
              Start a conversation
            </p>
            <ul className="space-y-0.5">{others.map(item)}</ul>
          </>
        )}
      </nav>
    </div>
  );
}
