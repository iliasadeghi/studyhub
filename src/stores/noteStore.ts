import { create } from 'zustand';
import type { Note, NoteVisibility } from '@/types';
import { supabase } from '@/lib/supabase';
import type { NoteRow } from '@/services/rows';
import { currentUserId } from './authStore';
import { newId, remote } from './sync';

const FONT_KEY = 'studyhub:note-font';

function readFontScale(): number {
  try {
    return Number(localStorage.getItem(FONT_KEY)) || 1;
  } catch {
    return 1;
  }
}

interface NoteState {
  notes: Note[];
  bookmarks: string[];
  /** note id → ISO time last opened */
  lastViewed: Record<string, string>;
  fontScale: number;
  hydrate: (data: Pick<NoteState, 'notes' | 'bookmarks' | 'lastViewed'>) => void;
  reset: () => void;
  addNote: (
    input: Pick<Note, 'classId' | 'unit' | 'title' | 'content'> & { visibility?: NoteVisibility },
  ) => Note;
  updateNote: (
    id: string,
    patch: Partial<Pick<Note, 'title' | 'content' | 'unit' | 'classId' | 'visibility'>>,
  ) => void;
  deleteNote: (id: string) => void;
  toggleBookmark: (id: string) => void;
  markViewed: (id: string) => void;
  setFontScale: (scale: number) => void;
}

export const useNoteStore = create<NoteState>()((set, get) => ({
  notes: [],
  bookmarks: [],
  lastViewed: {},
  fontScale: readFontScale(),
  hydrate: (data) => set(data),
  reset: () => set({ notes: [], bookmarks: [], lastViewed: {} }),
  addNote: ({ visibility = 'private', ...input }) => {
    const now = new Date().toISOString();
    const note: Note = {
      ...input,
      id: newId(),
      authorId: currentUserId(),
      visibility,
      kind: visibility === 'class' ? 'teacher' : 'mine',
      createdAt: now,
      updatedAt: now,
    };
    const before = get().notes;
    set({ notes: [note, ...before] });
    void remote(
      supabase.from('notes').insert({
        id: note.id,
        class_id: note.classId,
        unit: note.unit,
        title: note.title,
        content: note.content,
        visibility,
      }),
      () => set({ notes: before }),
      'create the note',
    );
    return note;
  },
  updateNote: (id, patch) => {
    const before = get().notes;
    const me = currentUserId();
    const cur = before.find((n) => n.id === id);
    if (!cur || cur.authorId !== me) return;
    const visibility = patch.visibility ?? cur.visibility;
    const next: Note = {
      ...cur,
      ...patch,
      visibility,
      kind: visibility === 'class' ? 'teacher' : 'mine',
      updatedAt: new Date().toISOString(),
    };
    set({ notes: before.map((n) => (n.id === id ? next : n)) });
    const row: Partial<NoteRow> = {};
    if (patch.title !== undefined) row.title = patch.title;
    if (patch.content !== undefined) row.content = patch.content;
    if (patch.unit !== undefined) row.unit = patch.unit;
    if (patch.classId !== undefined) row.class_id = patch.classId;
    if (patch.visibility !== undefined) row.visibility = patch.visibility;
    void remote(
      supabase.from('notes').update(row).eq('id', id),
      () => set({ notes: before }),
      'save the note',
    );
  },
  deleteNote: (id) => {
    const before = get();
    set({
      notes: before.notes.filter((n) => n.id !== id),
      bookmarks: before.bookmarks.filter((b) => b !== id),
    });
    void remote(
      supabase.from('notes').delete().eq('id', id),
      () => set({ notes: before.notes, bookmarks: before.bookmarks }),
      'delete the note',
    );
  },
  toggleBookmark: (id) => {
    const before = get().bookmarks;
    const on = !before.includes(id);
    set({ bookmarks: on ? [...before, id] : before.filter((b) => b !== id) });
    void remote(
      supabase
        .from('note_views')
        .upsert({ note_id: id, bookmarked: on }, { onConflict: 'user_id,note_id' }),
      () => set({ bookmarks: before }),
      'update the bookmark',
    );
  },
  markViewed: (id) => {
    const at = new Date().toISOString();
    set((s) => ({ lastViewed: { ...s.lastViewed, [id]: at } }));
    // Best effort: a failed "last viewed" write isn't worth bothering the user about.
    void supabase
      .from('note_views')
      .upsert(
        { note_id: id, last_viewed: at, bookmarked: get().bookmarks.includes(id) },
        { onConflict: 'user_id,note_id' },
      )
      .then(() => undefined);
  },
  setFontScale: (scale) => {
    const fontScale = Math.min(1.4, Math.max(0.85, scale));
    set({ fontScale });
    try {
      localStorage.setItem(FONT_KEY, String(fontScale));
    } catch {
      /* ignore */
    }
  },
}));
