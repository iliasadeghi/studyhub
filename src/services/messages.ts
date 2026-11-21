/**
 * Real-time messaging between students and their teachers (Supabase).
 *
 * - Messages are rows in `messages`; RLS lets only the two participants read them.
 * - New messages and read receipts arrive through Supabase Realtime.
 * - Typing indicators and "online" status use a per-conversation channel
 *   (broadcast + presence) and are never stored.
 */
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Message, Teacher, UserRole } from '@/types';
import { supabase } from '@/lib/supabase';
import { useTeacherStore } from '@/stores/teacherStore';
import { useAuthStore } from '@/stores/authStore';
import { newId, unwrap } from '@/stores/sync';
import { toast } from '@/stores/uiStore';
import { contactFromProfile, messageFromRow } from './userData';
import type { ConversationRow, MessageRow, ProfileRow } from './rows';

export interface MessageService {
  send(contactId: string, body: string): Promise<Message | null>;
  markRead(contactId: string): Promise<void>;
  /** Subscribe to incoming messages from other people. Returns an unsubscribe function. */
  onIncoming(cb: (msg: Message) => void): () => void;
}

export interface MessageTemplate {
  id: string;
  label: string;
  topic: string;
  /** Which role sees this template */
  for: UserRole;
  body: (ctx: { teacher: string; className: string; student: string }) => string;
}

export const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: 'extension',
    for: 'student',
    label: 'Request extension',
    topic: 'Extension request',
    body: ({ teacher, className, student }) =>
      `Hi ${teacher},\n\nI'm writing to ask if I could have a short extension on the upcoming ${className} assignment. I've been working on it but need a little more time to do my best work. Would a two-day extension be possible?\n\nThank you,\n${student}`,
  },
  {
    id: 'question',
    for: 'student',
    label: 'Question about assignment',
    topic: 'Question about assignment',
    body: ({ teacher, className, student }) =>
      `Hi ${teacher},\n\nI have a question about the current ${className} assignment: \n\nThanks for your help!\n${student}`,
  },
  {
    id: 'absent',
    for: 'student',
    label: 'Absent from class',
    topic: 'Absence',
    body: ({ teacher, className, student }) =>
      `Hi ${teacher},\n\nI'll be absent from ${className} on [date] because [reason]. Could you let me know what I'll miss and how I can catch up?\n\nThank you,\n${student}`,
  },
  {
    id: 'meeting',
    for: 'student',
    label: 'Ask to meet',
    topic: 'Meeting request',
    body: ({ teacher, className, student }) =>
      `Hi ${teacher},\n\nWould you have time to meet during office hours this week? I'd like some extra help with ${className}.\n\nThanks,\n${student}`,
  },
  {
    id: 'missing',
    for: 'teacher',
    label: 'Missing work',
    topic: 'Missing work',
    body: ({ student, className }) =>
      `Hi ${student},\n\nI noticed I haven't received your latest ${className} assignment yet. Is everything okay? Let me know if you need help or a little more time.`,
  },
  {
    id: 'great-work',
    for: 'teacher',
    label: 'Great work',
    topic: 'Great work',
    body: ({ student, className }) =>
      `Hi ${student},\n\nJust wanted to say great work in ${className} lately. Keep it up!`,
  },
  {
    id: 'checkin',
    for: 'teacher',
    label: 'Check in',
    topic: 'Checking in',
    body: ({ student }) =>
      `Hi ${student},\n\nHow are things going? Come by office hours if you'd like to go over anything.`,
  },
];

const listeners = new Set<(msg: Message) => void>();

function me(): string {
  const id = useAuthStore.getState().userId;
  if (!id) throw new Error('Not signed in');
  return id;
}

async function conversationIdFor(contactId: string): Promise<string> {
  const known = useTeacherStore.getState().conversations[contactId];
  if (known) return known;
  const id = unwrap(
    await supabase.rpc('get_or_create_conversation', { other: contactId }),
  ) as string;
  useTeacherStore.getState().setConversation(contactId, id);
  return id;
}

/** Find which contact a conversation belongs to, loading it if it's new to us. */
async function contactForConversation(conversationId: string): Promise<string | null> {
  const store = useTeacherStore.getState();
  const hit = Object.entries(store.conversations).find(([, conv]) => conv === conversationId);
  if (hit) return hit[0];
  const { data: conv } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .maybeSingle<ConversationRow>();
  if (!conv) return null;
  const other = conv.student_id === me() ? conv.teacher_id : conv.student_id;
  store.setConversation(other, conversationId);
  if (!store.teachers.some((t) => t.id === other)) {
    const { data: p } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', other)
      .maybeSingle<ProfileRow>();
    if (p) store.upsertContact(contactFromProfile(p, []));
  }
  return other;
}

export const messageService: MessageService = {
  async send(contactId, body) {
    const text = body.trim();
    if (!text) return null;
    const store = useTeacherStore.getState();
    const optimistic: Message = {
      id: newId(),
      conversationId: store.conversations[contactId] ?? '',
      contactId,
      senderId: me(),
      mine: true,
      body: text,
      sentAt: new Date().toISOString(),
      read: false,
      pending: true,
    };
    store.putMessage(optimistic);
    try {
      const conversationId = await conversationIdFor(contactId);
      const row = unwrap(
        await supabase
          .from('messages')
          .insert({
            id: optimistic.id,
            conversation_id: conversationId,
            sender_id: me(),
            body: text,
          })
          .select()
          .single<MessageRow>(),
      );
      const saved = messageFromRow(row, me(), contactId);
      useTeacherStore.getState().putMessage(saved);
      return saved;
    } catch (err) {
      useTeacherStore.getState().removeMessage(optimistic.id);
      toast({
        variant: 'error',
        title: 'Message not sent',
        description: err instanceof Error ? err.message : 'Check your connection and try again.',
      });
      return null;
    }
  },

  async markRead(contactId) {
    const store = useTeacherStore.getState();
    const conversationId = store.conversations[contactId];
    if (!conversationId) return;
    const hasUnread = store.messages.some((m) => m.contactId === contactId && !m.mine && !m.read);
    if (!hasUnread) return;
    store.markThreadReadLocal(contactId);
    await supabase.rpc('mark_conversation_read', { cid: conversationId });
  },

  onIncoming(cb) {
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  },
};

/**
 * Listen for new messages and read receipts across all of the user's
 * conversations. Call once after sign-in; returns a cleanup function.
 */
export function subscribeToMessages(userId: string): () => void {
  const channel = supabase
    .channel(`inbox:${userId}`)
    .on<MessageRow>(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      async ({ new: row }) => {
        const contactId = await contactForConversation(row.conversation_id);
        if (!contactId) return;
        const msg = messageFromRow(row, userId, contactId);
        const store = useTeacherStore.getState();
        store.putMessage(msg);
        if (!msg.mine) {
          store.setTyping(contactId, false);
          listeners.forEach((cb) => cb(msg));
        }
      },
    )
    .on<MessageRow>(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'messages' },
      async ({ new: row }) => {
        const contactId = await contactForConversation(row.conversation_id);
        if (contactId)
          useTeacherStore.getState().putMessage(messageFromRow(row, userId, contactId));
      },
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}

export interface ConversationLink {
  /** Tell the other person you're typing (call on input; auto-clears). */
  typing: () => void;
  leave: () => void;
}

/** Join a conversation's live channel for typing indicators and online presence. */
export function joinConversation(conversationId: string, contactId: string): ConversationLink {
  const userId = me();
  const store = useTeacherStore.getState();
  let typingTimer: number | undefined;
  let lastSent = 0;

  const channel: RealtimeChannel = supabase.channel(`conversation:${conversationId}`, {
    config: { presence: { key: userId }, broadcast: { self: false } },
  });

  channel
    .on('broadcast', { event: 'typing' }, ({ payload }) => {
      if ((payload as { userId?: string }).userId !== contactId) return;
      store.setTyping(contactId, true);
      window.clearTimeout(typingTimer);
      typingTimer = window.setTimeout(
        () => useTeacherStore.getState().setTyping(contactId, false),
        3000,
      );
    })
    .on('presence', { event: 'sync' }, () => {
      useTeacherStore.getState().setOnline(contactId, contactId in channel.presenceState());
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') void channel.track({ online_at: new Date().toISOString() });
    });

  return {
    typing: () => {
      const now = Date.now();
      if (now - lastSent < 1500) return;
      lastSent = now;
      void channel.send({ type: 'broadcast', event: 'typing', payload: { userId } });
    },
    leave: () => {
      window.clearTimeout(typingTimer);
      useTeacherStore.getState().setTyping(contactId, false);
      useTeacherStore.getState().setOnline(contactId, false);
      void supabase.removeChannel(channel);
    },
  };
}

export function firstName(person: Pick<Teacher, 'name'> | undefined): string {
  return person?.name.split(' ')[0] ?? 'there';
}
