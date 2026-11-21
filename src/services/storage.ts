/** Download a JSON copy of everything the signed-in user can see. */
import { useTaskStore } from '@/stores/taskStore';
import { useClassStore } from '@/stores/classStore';
import { useNoteStore } from '@/stores/noteStore';
import { useTeacherStore } from '@/stores/teacherStore';
import { useEventStore } from '@/stores/eventStore';
import { useAuthStore } from '@/stores/authStore';

export function exportData() {
  const notes = useNoteStore.getState();
  const people = useTeacherStore.getState();
  const events = useEventStore.getState();
  return {
    app: 'studyhub',
    exportedAt: new Date().toISOString(),
    profile: useAuthStore.getState().profile,
    classes: useClassStore.getState().classes,
    tasks: useTaskStore.getState().tasks,
    notes: notes.notes,
    bookmarks: notes.bookmarks,
    events: events.events,
    bookings: events.bookings,
    contacts: people.teachers.map(({ id, name, role, subjects }) => ({ id, name, role, subjects })),
    messages: people.messages,
  };
}

export function downloadExport(): void {
  const blob = new Blob([JSON.stringify(exportData(), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `studyhub-export-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
