import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Message, Teacher } from '@/types';
import { uid } from '@/utils/id';
import { getSampleData } from '@/mockData';
import { STORE_VERSION, storageKey } from './persist';

interface TeacherState {
  teachers: Teacher[];
  messages: Message[];
  /** teacherId → currently "typing" (not persisted) */
  typing: Record<string, boolean>;
  addTeacher: (input: Omit<Teacher, 'id'>) => Teacher;
  updateTeacher: (id: string, patch: Partial<Teacher>) => void;
  deleteTeacher: (id: string) => void;
  appendMessage: (msg: Message) => void;
  markThreadRead: (teacherId: string) => void;
  setTyping: (teacherId: string, typing: boolean) => void;
  replaceAll: (data: Pick<TeacherState, 'teachers' | 'messages'>) => void;
}

export const useTeacherStore = create<TeacherState>()(
  persist(
    (set) => ({
      teachers: getSampleData().teachers,
      messages: getSampleData().messages,
      typing: {},
      addTeacher: (input) => {
        const teacher = { ...input, id: uid('teacher') };
        set((s) => ({ teachers: [...s.teachers, teacher] }));
        return teacher;
      },
      updateTeacher: (id, patch) =>
        set((s) => ({ teachers: s.teachers.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
      deleteTeacher: (id) =>
        set((s) => ({
          teachers: s.teachers.filter((t) => t.id !== id),
          messages: s.messages.filter((m) => m.teacherId !== id),
        })),
      appendMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
      markThreadRead: (teacherId) =>
        set((s) => ({
          messages: s.messages.map((m) =>
            m.teacherId === teacherId && !m.read ? { ...m, read: true } : m,
          ),
        })),
      setTyping: (teacherId, typing) =>
        set((s) => ({ typing: { ...s.typing, [teacherId]: typing } })),
      replaceAll: (data) => set(data),
    }),
    {
      name: storageKey('teachers'),
      version: STORE_VERSION,
      partialize: (s) => ({ teachers: s.teachers, messages: s.messages }),
    },
  ),
);

export function makeMessage(teacherId: string, from: Message['from'], body: string): Message {
  return {
    id: uid('msg'),
    teacherId,
    from,
    body,
    sentAt: new Date().toISOString(),
    read: from === 'student',
  };
}
