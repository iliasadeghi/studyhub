/**
 * Data portability: export / import / reset. With a real backend these become API
 * calls (e.g. GET /export, POST /import); the UI would not need to change.
 */
import { useTaskStore } from '@/stores/taskStore';
import { useClassStore } from '@/stores/classStore';
import { useNoteStore } from '@/stores/noteStore';
import { useTeacherStore } from '@/stores/teacherStore';
import { useEventStore } from '@/stores/eventStore';
import { pickSettings, useSettingsStore } from '@/stores/settingsStore';
import { STORE_VERSION } from '@/stores/persist';
import { createSampleData } from '@/mockData';
import type { CalendarEvent, ClassItem, Message, Note, Task, Teacher, UserSettings } from '@/types';

export interface ExportBundle {
  app: 'studyhub';
  version: number;
  exportedAt: string;
  settings: UserSettings;
  classes: ClassItem[];
  teachers: Teacher[];
  tasks: Task[];
  notes: Note[];
  bookmarks: string[];
  lastViewed: Record<string, string>;
  messages: Message[];
  events: CalendarEvent[];
}

export function exportData(): ExportBundle {
  const notes = useNoteStore.getState();
  const teachers = useTeacherStore.getState();
  return {
    app: 'studyhub',
    version: STORE_VERSION,
    exportedAt: new Date().toISOString(),
    settings: pickSettings(useSettingsStore.getState()),
    classes: useClassStore.getState().classes,
    teachers: teachers.teachers,
    tasks: useTaskStore.getState().tasks,
    notes: notes.notes,
    bookmarks: notes.bookmarks,
    lastViewed: notes.lastViewed,
    messages: teachers.messages,
    events: useEventStore.getState().events,
  };
}

export function downloadExport(): void {
  const blob = new Blob([JSON.stringify(exportData(), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `studyhub-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function isArray(v: unknown): v is unknown[] {
  return Array.isArray(v);
}

/** Validates the shape loosely and loads it into every store. Throws on invalid input. */
export function importData(raw: string): void {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error('That file is not valid JSON.');
  }
  if (typeof data !== 'object' || data === null || (data as { app?: string }).app !== 'studyhub') {
    throw new Error("This doesn't look like a StudyHub backup.");
  }
  const b = data as Partial<ExportBundle>;
  const required: (keyof ExportBundle)[] = [
    'classes',
    'teachers',
    'tasks',
    'notes',
    'messages',
    'events',
  ];
  for (const key of required) {
    if (!isArray(b[key])) throw new Error(`Backup is missing "${key}".`);
  }
  applyBundle(b as ExportBundle);
}

function applyBundle(b: Omit<ExportBundle, 'app' | 'version' | 'exportedAt'>): void {
  useClassStore.getState().replaceAll(b.classes);
  useTeacherStore.getState().replaceAll({ teachers: b.teachers, messages: b.messages });
  useTaskStore.getState().replaceAll(b.tasks);
  useNoteStore.getState().replaceAll({
    notes: b.notes,
    bookmarks: b.bookmarks ?? [],
    lastViewed: b.lastViewed ?? {},
  });
  useEventStore.getState().replaceAll(b.events);
  if (b.settings) useSettingsStore.getState().replace(b.settings);
}

/** Replace everything with freshly generated sample data (keeps profile + preferences). */
export function resetToSampleData(): void {
  const sample = createSampleData();
  applyBundle({ ...sample, settings: pickSettings(useSettingsStore.getState()) });
}

/** Wipe all content (used when a student sets up their own classes in onboarding). */
export function startFresh(classes: ClassItem[], teachers: Teacher[]): void {
  applyBundle({
    classes,
    teachers,
    tasks: [],
    notes: [],
    bookmarks: [],
    lastViewed: {},
    messages: [],
    events: [],
    settings: pickSettings(useSettingsStore.getState()),
  });
}
