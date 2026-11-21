import { create } from 'zustand';
import type { Contact, Message, OfficeHour } from '@/types';
import { supabase } from '@/lib/supabase';
import { officeHourFromRow, type OfficeHourRow } from '@/services/rows';
import { unwrap } from './sync';

/**
 * People you can talk to and your conversations with them.
 * Students see their teachers; teachers see their students.
 * (Named "teacherStore" for history; `teachers` holds all contacts.)
 */
interface PeopleState {
  teachers: Contact[];
  /** contactId → conversationId */
  conversations: Record<string, string>;
  messages: Message[];
  /** contactId → currently typing (live, not persisted) */
  typing: Record<string, boolean>;
  /** contactId → currently online in a shared conversation */
  online: Record<string, boolean>;
  /** Teachers: your own office hours */
  myOfficeHours: OfficeHour[];
  hydrate: (
    data: Pick<PeopleState, 'teachers' | 'conversations' | 'messages' | 'myOfficeHours'>,
  ) => void;
  reset: () => void;
  upsertContact: (contact: Contact) => void;
  setConversation: (contactId: string, conversationId: string) => void;
  /** Add or replace a message (dedupes optimistic copies by id). */
  putMessage: (msg: Message) => void;
  removeMessage: (id: string) => void;
  markThreadReadLocal: (contactId: string) => void;
  setTyping: (contactId: string, typing: boolean) => void;
  setOnline: (contactId: string, online: boolean) => void;
  saveOfficeHours: (hours: OfficeHour[]) => Promise<void>;
}

const EMPTY = {
  teachers: [],
  conversations: {},
  messages: [],
  typing: {},
  online: {},
  myOfficeHours: [],
};

export const useTeacherStore = create<PeopleState>()((set) => ({
  ...EMPTY,
  hydrate: (data) => set({ ...data, typing: {}, online: {} }),
  reset: () => set(EMPTY),
  upsertContact: (contact) =>
    set((s) => ({
      teachers: s.teachers.some((t) => t.id === contact.id)
        ? s.teachers.map((t) => (t.id === contact.id ? contact : t))
        : [...s.teachers, contact],
    })),
  setConversation: (contactId, conversationId) =>
    set((s) => ({ conversations: { ...s.conversations, [contactId]: conversationId } })),
  putMessage: (msg) =>
    set((s) => {
      const exists = s.messages.some((m) => m.id === msg.id);
      const messages = exists
        ? s.messages.map((m) => (m.id === msg.id ? msg : m))
        : [...s.messages, msg];
      messages.sort((a, b) => a.sentAt.localeCompare(b.sentAt));
      return { messages };
    }),
  removeMessage: (id) => set((s) => ({ messages: s.messages.filter((m) => m.id !== id) })),
  markThreadReadLocal: (contactId) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.contactId === contactId && !m.mine && !m.read ? { ...m, read: true } : m,
      ),
    })),
  setTyping: (contactId, typing) => set((s) => ({ typing: { ...s.typing, [contactId]: typing } })),
  setOnline: (contactId, online) => set((s) => ({ online: { ...s.online, [contactId]: online } })),
  saveOfficeHours: async (hours) => {
    const { data: auth } = await supabase.auth.getUser();
    const teacherId = auth.user?.id;
    if (!teacherId) throw new Error('Not signed in');
    unwrap(await supabase.from('office_hours').delete().eq('teacher_id', teacherId));
    if (hours.length > 0) {
      const rows = unwrap(
        await supabase
          .from('office_hours')
          .insert(
            hours.map((h) => ({
              day: h.day,
              start_time: h.start,
              end_time: h.end,
              location: h.location,
            })),
          )
          .select(),
      ) as OfficeHourRow[];
      set({ myOfficeHours: rows.map(officeHourFromRow) });
    } else {
      set({ myOfficeHours: [] });
    }
  },
}));
