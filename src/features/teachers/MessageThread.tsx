import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { format, isSameDay, isToday, isYesterday } from 'date-fns';
import { MessageCircle } from 'lucide-react';
import type { Message, Teacher } from '@/types';
import { cn } from '@/utils/cn';
import { EmptyState } from '@/components/ui/Misc';

function dayLabel(d: Date): string {
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'EEEE, MMM d');
}

function TypingDots({ name }: { name: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex items-center gap-2"
      role="status"
    >
      <span className="sr-only">{name} is typing</span>
      <div className="flex gap-1 rounded-2xl rounded-bl-md bg-surface-2 px-4 py-3" aria-hidden>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-2 w-2 rounded-full bg-subtle"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </motion.div>
  );
}

export function MessageThread({
  teacher,
  messages,
  typing,
}: {
  teacher: Teacher;
  messages: Message[];
  typing: boolean;
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, typing]);

  if (messages.length === 0 && !typing) {
    return (
      <EmptyState
        compact
        icon={<MessageCircle className="h-6 w-6" />}
        title={`Start a conversation with ${teacher.name}`}
        description="Pick a template below or write your own message."
      />
    );
  }

  return (
    <div
      className="space-y-3"
      role="log"
      aria-live="polite"
      aria-label={`Messages with ${teacher.name}`}
    >
      {messages.map((m, i) => {
        const d = new Date(m.sentAt);
        const showDay = i === 0 || !isSameDay(d, new Date(messages[i - 1].sentAt));
        const mine = m.from === 'student';
        return (
          <div key={m.id}>
            {showDay && (
              <p className="my-4 text-center text-xs font-semibold text-muted">
                <span className="rounded-full bg-surface-2 px-3 py-1">{dayLabel(d)}</span>
              </p>
            )}
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2 }}
              className={cn('flex flex-col', mine ? 'items-end' : 'items-start')}
            >
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap sm:max-w-[75%]',
                  mine
                    ? 'rounded-br-md bg-accent text-accent-fg'
                    : 'rounded-bl-md bg-surface-2 text-fg',
                )}
              >
                <span className="sr-only">{mine ? 'You' : teacher.name}: </span>
                {m.body}
              </div>
              <span className="mt-1 px-1 text-[11px] text-muted">{format(d, 'h:mm a')}</span>
            </motion.div>
          </div>
        );
      })}
      <AnimatePresence>{typing && <TypingDots name={teacher.name} />}</AnimatePresence>
      <div ref={endRef} />
    </div>
  );
}
