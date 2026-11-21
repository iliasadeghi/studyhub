import { useTeacherStore } from '@/stores/teacherStore';

/** Number of unread incoming messages across all conversations. */
export function useUnreadCount(): number {
  return useTeacherStore((s) => s.messages.filter((m) => !m.mine && !m.read).length);
}
