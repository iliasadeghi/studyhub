/**
 * Messaging service.
 *
 * The UI talks only to `messageService`. Today it's backed by localStorage (via the
 * teacher store) with a simulated auto-reply. To use a real backend, implement
 * `MessageService` with fetch/WebSocket calls and swap the export at the bottom.
 */
import type { Message, Teacher } from '@/types';
import { makeMessage, useTeacherStore } from '@/stores/teacherStore';

export interface MessageService {
  send(teacherId: string, body: string): Promise<Message>;
  markRead(teacherId: string): Promise<void>;
  /** Subscribe to incoming teacher messages. Returns an unsubscribe function. */
  onIncoming(cb: (msg: Message) => void): () => void;
}

export interface MessageTemplate {
  id: string;
  label: string;
  topic: string;
  body: (ctx: { teacher: string; className: string; student: string }) => string;
}

export const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: 'extension',
    label: 'Request extension',
    topic: 'Extension request',
    body: ({ teacher, className, student }) =>
      `Hi ${teacher},\n\nI'm writing to ask if I could have a short extension on the upcoming ${className} assignment. I've been working on it but need a little more time to do my best work. Would a two-day extension be possible?\n\nThank you,\n${student}`,
  },
  {
    id: 'question',
    label: 'Question about assignment',
    topic: 'Question about assignment',
    body: ({ teacher, className, student }) =>
      `Hi ${teacher},\n\nI have a question about the current ${className} assignment: \n\nThanks for your help!\n${student}`,
  },
  {
    id: 'absent',
    label: 'Absent from class',
    topic: 'Absence',
    body: ({ teacher, className, student }) =>
      `Hi ${teacher},\n\nI'll be absent from ${className} on [date] because [reason]. Could you let me know what I'll miss and how I can catch up?\n\nThank you,\n${student}`,
  },
  {
    id: 'meeting',
    label: 'Ask to meet',
    topic: 'Meeting request',
    body: ({ teacher, className, student }) =>
      `Hi ${teacher},\n\nWould you have time to meet during office hours this week? I'd like some extra help with ${className}.\n\nThanks,\n${student}`,
  },
];

const listeners = new Set<(msg: Message) => void>();

function firstName(teacher: Teacher | undefined): string {
  return teacher?.name.split(' ')[0] ?? 'Your teacher';
}

/** Pick a plausible canned reply based on keywords in the student's message. */
export function autoReplyFor(body: string): string {
  const text = body.toLowerCase();
  if (/(extension|extra time|more time|late)/.test(text))
    return "Thanks for reaching out early — that's the right move. I can give you two extra days. Let me know if anything else comes up.";
  if (/(absent|miss|sick|appointment)/.test(text))
    return "Thanks for letting me know. I've posted today's notes in the Notes section; check them and ask me if anything is confusing. Feel better!";
  if (/(meet|office hours|extra help)/.test(text))
    return 'Of course! Book a slot during my office hours on the Teachers page and I will see you there.';
  if (/\?/.test(text))
    return 'Good question! Short answer: check the latest notes for this unit first. If it still is not clear, bring it to class tomorrow and we will go through it together.';
  return 'Thanks for the message! I will get back to you soon.';
}

const localMessageService: MessageService = {
  async send(teacherId, body) {
    const store = useTeacherStore.getState();
    const msg = makeMessage(teacherId, 'student', body.trim());
    store.appendMessage(msg);

    // Simulated teacher reply.
    const typingDelay = 900 + Math.random() * 800;
    const replyDelay = typingDelay + 1400 + Math.random() * 1200;
    window.setTimeout(() => useTeacherStore.getState().setTyping(teacherId, true), typingDelay);
    window.setTimeout(() => {
      const s = useTeacherStore.getState();
      s.setTyping(teacherId, false);
      const reply = makeMessage(teacherId, 'teacher', autoReplyFor(body));
      s.appendMessage(reply);
      listeners.forEach((cb) => cb(reply));
    }, replyDelay);

    return msg;
  },
  async markRead(teacherId) {
    useTeacherStore.getState().markThreadRead(teacherId);
  },
  onIncoming(cb) {
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  },
};

export const messageService: MessageService = localMessageService;

export function teacherFirstName(teacher: Teacher | undefined): string {
  return firstName(teacher);
}
