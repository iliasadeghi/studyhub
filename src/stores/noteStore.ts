import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Note } from '@/types';
import { uid } from '@/utils/id';
import { getSampleData } from '@/mockData';
import { STORE_VERSION, storageKey } from './persist';

interface NoteState {
  notes: Note[];
  bookmarks: string[];
  /** note id → ISO time last opened */
  lastViewed: Record<string, string>;
  fontScale: number;
  addNote: (input: Pick<Note, 'classId' | 'unit' | 'title' | 'content'>) => Note;
  updateNote: (
    id: string,
    patch: Partial<Pick<Note, 'title' | 'content' | 'unit' | 'classId'>>,
  ) => void;
  deleteNote: (id: string) => void;
  toggleBookmark: (id: string) => void;
  markViewed: (id: string) => void;
  setFontScale: (scale: number) => void;
  replaceAll: (data: Pick<NoteState, 'notes' | 'bookmarks' | 'lastViewed'>) => void;
}

export const useNoteStore = create<NoteState>()(
  persist(
    (set) => ({
      notes: getSampleData().notes,
      bookmarks: getSampleData().bookmarks,
      lastViewed: getSampleData().lastViewed,
      fontScale: 1,
      addNote: (input) => {
        const now = new Date().toISOString();
        const note: Note = {
          ...input,
          id: uid('note'),
          kind: 'mine',
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ notes: [note, ...s.notes] }));
        return note;
      },
      updateNote: (id, patch) =>
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === id && n.kind === 'mine'
              ? { ...n, ...patch, updatedAt: new Date().toISOString() }
              : n,
          ),
        })),
      deleteNote: (id) =>
        set((s) => ({
          notes: s.notes.filter((n) => n.id !== id || n.kind === 'teacher'),
          bookmarks: s.bookmarks.filter((b) => b !== id),
        })),
      toggleBookmark: (id) =>
        set((s) => ({
          bookmarks: s.bookmarks.includes(id)
            ? s.bookmarks.filter((b) => b !== id)
            : [...s.bookmarks, id],
        })),
      markViewed: (id) =>
        set((s) => ({ lastViewed: { ...s.lastViewed, [id]: new Date().toISOString() } })),
      setFontScale: (fontScale) => set({ fontScale: Math.min(1.4, Math.max(0.85, fontScale)) }),
      replaceAll: (data) => set(data),
    }),
    { name: storageKey('notes'), version: STORE_VERSION },
  ),
);
