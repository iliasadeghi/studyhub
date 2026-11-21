import { useState, type FormEvent } from 'react';
import { FileText, Send } from 'lucide-react';
import type { ClassItem, Teacher } from '@/types';
import { MESSAGE_TEMPLATES, messageService } from '@/services/messages';
import { useSettingsStore } from '@/stores/settingsStore';
import { Menu } from '@/components/ui/Menu';
import { Button } from '@/components/ui/Button';

export function MessageComposer({
  teacher,
  classItem,
}: {
  teacher: Teacher;
  classItem?: ClassItem;
}) {
  const student = useSettingsStore((s) => s.name) || 'Student';
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const send = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!body.trim() || sending) return;
    setSending(true);
    await messageService.send(teacher.id, body);
    setBody('');
    setSending(false);
  };

  return (
    <form onSubmit={send} className="border-t border-border bg-surface p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Menu
          align="left"
          items={MESSAGE_TEMPLATES.map((t) => ({
            label: t.label,
            onSelect: () =>
              setBody(
                t.body({ teacher: teacher.name, className: classItem?.name ?? 'class', student }),
              ),
          }))}
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
        <span className="hidden text-xs text-subtle sm:inline">
          Enter to send · Shift+Enter for a new line
        </span>
      </div>
      <div className="flex items-end gap-2">
        <label htmlFor="message-body" className="sr-only">
          Message to {teacher.name}
        </label>
        <textarea
          id="message-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          rows={Math.min(6, Math.max(1, body.split('\n').length))}
          placeholder={`Message ${teacher.name}…`}
          className="max-h-40 min-h-10 flex-1 resize-none rounded-md border border-border bg-bg px-3 py-2.5 text-sm placeholder:text-subtle focus:border-accent focus:outline-none"
        />
        <Button
          type="submit"
          aria-label="Send message"
          disabled={!body.trim() || sending}
          className="h-10 w-10 px-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
