import { useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import type { Contact } from '@/types';
import { useTeacherStore } from '@/stores/teacherStore';
import { joinConversation, messageService, type ConversationLink } from '@/services/messages';
import { buildMailto } from '@/utils/mailto';
import { Avatar } from '@/components/ui/Misc';
import { MessageThread } from '@/features/teachers/MessageThread';
import { MessageComposer } from '@/features/teachers/MessageComposer';

/** One live conversation: header with presence, message log and composer. */
export function ThreadPanel({ contact }: { contact: Contact }) {
  const allMessages = useTeacherStore((s) => s.messages);
  const conversationId = useTeacherStore((s) => s.conversations[contact.id]);
  const typing = useTeacherStore((s) => !!s.typing[contact.id]);
  const online = useTeacherStore((s) => !!s.online[contact.id]);
  const linkRef = useRef<ConversationLink | null>(null);

  const messages = useMemo(
    () => allMessages.filter((m) => m.contactId === contact.id),
    [allMessages, contact.id],
  );
  const unread = messages.some((m) => !m.mine && !m.read);

  // Live typing + presence channel once the conversation exists.
  useEffect(() => {
    if (!conversationId) return;
    const link = joinConversation(conversationId, contact.id);
    linkRef.current = link;
    return () => {
      link.leave();
      linkRef.current = null;
    };
  }, [conversationId, contact.id]);

  // Mark as read when opened and whenever new messages arrive while you're looking.
  useEffect(() => {
    if (unread && !document.hidden) void messageService.markRead(contact.id);
  }, [unread, contact.id]);

  useEffect(() => {
    const onVisible = () => {
      if (!document.hidden) void messageService.markRead(contact.id);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [contact.id]);

  const status = typing
    ? 'typing…'
    : online
      ? 'Online'
      : contact.subjects.join(', ') || (contact.role === 'teacher' ? 'Teacher' : 'Student');

  return (
    <section
      aria-label={`Conversation with ${contact.name}`}
      className="flex h-full min-h-0 flex-col"
    >
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Link
          to="/messages"
          className="-ml-1 grid h-9 w-9 place-items-center rounded-md text-muted hover:bg-surface-2 lg:hidden"
          aria-label="Back to conversations"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="relative">
          <Avatar name={contact.name} color={contact.avatarColor} size="sm" />
          {online && (
            <span
              aria-hidden
              className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-surface bg-success"
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-bold">{contact.name}</h2>
          <p
            className={`truncate text-xs ${typing || online ? 'font-semibold text-success' : 'text-muted'}`}
            aria-live="polite"
          >
            {status}
          </p>
        </div>
        {contact.email && (
          <a
            href={buildMailto({
              to: contact.email,
              className: contact.subjects[0],
              topic: 'Question',
            })}
            className="inline-flex h-9 items-center gap-1.5 rounded-sm border border-border px-3 text-sm font-semibold hover:bg-surface-2"
          >
            <Mail className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Email</span>
          </a>
        )}
      </header>
      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <MessageThread teacher={contact} messages={messages} typing={typing} />
      </div>
      <MessageComposer contact={contact} onTyping={() => linkRef.current?.typing()} />
    </section>
  );
}
