import { useState, type FormEvent } from 'react';
import { FileText, Lock, Send } from 'lucide-react';
import type { Contact } from '@/types';
import { MESSAGE_TEMPLATES, firstName, messageService } from '@/services/messages';
import { useProfile } from '@/stores/authStore';
import { Menu } from '@/components/ui/Menu';
import { Button } from '@/components/ui/Button';
import { useFeature } from '@/stores/schoolStore';
import { useTeacherStore } from '@/stores/teacherStore';

interface Props {
  contact: Contact;
  /** Called while typing so the other person sees "typing…" */
  onTyping?: () => void;
}

export function MessageComposer({ contact, onTyping }: Props) {
  const me = useProfile();
  const [body, setBody] = useState('');
  const className = contact.subjects[0] ?? 'class';
  const templates = MESSAGE_TEMPLATES.filter((t) => t.for === me.role);
  const messaging = useFeature('messaging');
  const studentStart = useFeature('student_start');
  const hasConversation = useTeacherStore((s) => Boolean(s.conversations[contact.id]));
  const blocked = !messaging
    ? 'Messaging is turned off by your school right now. You can still read earlier messages.'
    : me.role === 'student' && !studentStart && !hasConversation
      ? `Your school lets teachers start conversations. You can reply once ${contact.name} messages you.`
      : '';

  const send = (e?: FormEvent) => {
    e?.preventDefault();
    const text = body.trim();
    if (!text) return;
    setBody(''); // optimistic: the message appears in the thread right away
    void messageService.send(contact.id, text);
  };

  const fill = (t: (typeof templates)[number]) =>
    setBody(
      t.body({
        teacher: me.role === 'student' ? contact.name : me.fullName,
        student: me.role === 'student' ? me.fullName || 'Student' : firstName(contact),
        className,
      }),
    );

  if (blocked) {
    return (
      <p className="flex items-start gap-2 border-t border-border bg-surface p-4 text-sm text-muted">
        <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        {blocked}
      </p>
    );
  }

  return (
    <form onSubmit={send} className="border-t border-border bg-surface p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {templates.length > 0 && (
          <Menu
            align="left"
            items={templates.map((t) => ({ label: t.label, onSelect: () => fill(t) }))}
            trigger={(props) => (
              <button
                type="button"
                {...props}
                className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-semibold text-muted hover:border-border-strong hover:text-fg"
              >
                <FileText className="h-3.5 w-3.5" aria-hidden /> Templates
              </button>
            )}
          />
        )}
        <span className="hidden text-xs text-subtle sm:inline">
          Enter to send · Shift+Enter for a new line
        </span>
      </div>
      <div className="flex items-end gap-2">
        <label htmlFor="message-body" className="sr-only">
          Message to {contact.name}
        </label>
        <textarea
          id="message-body"
          value={body}
          maxLength={4000}
          onChange={(e) => {
            setBody(e.target.value);
            if (e.target.value) onTyping?.();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              send();
            }
          }}
          rows={Math.min(6, Math.max(1, body.split('\n').length))}
          placeholder={`Message ${contact.name}…`}
          className="max-h-40 min-h-10 flex-1 resize-none rounded-md border border-border bg-bg px-3 py-2.5 text-sm placeholder:text-subtle focus:border-accent focus:outline-none"
        />
        <Button
          type="submit"
          aria-label="Send message"
          disabled={!body.trim()}
          className="h-10 w-10 px-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
