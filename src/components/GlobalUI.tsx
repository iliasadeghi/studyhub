import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUIStore } from '@/stores/uiStore';
import { useTeacherStore } from '@/stores/teacherStore';
import { useHotkeys } from '@/hooks/useHotkeys';
import { messageService } from '@/services/messages';
import { notify } from '@/services/notifications';
import { useSettingsStore } from '@/stores/settingsStore';
import { NAV_ITEMS } from '@/layouts/nav';
import { TaskFormModal } from './task-form/TaskFormModal';
import { CommandPalette } from './CommandPalette';
import { ShortcutsModal } from './ShortcutsModal';
import { Celebration } from './Celebration';

/** Global overlays, keyboard shortcuts and incoming-message alerts, mounted once in the layout. */
export function GlobalUI() {
  const navigate = useNavigate();
  const location = useLocation();
  const taskFormOpen = useUIStore((s) => s.taskForm.open);
  const commandOpen = useUIStore((s) => s.commandOpen);
  const shortcutsOpen = useUIStore((s) => s.shortcutsOpen);
  const { openTaskForm, setCommandOpen, setShortcutsOpen, pushToast } = useUIStore.getState();
  const anyOpen = taskFormOpen || commandOpen || shortcutsOpen;

  useHotkeys({ 'mod+k': () => setCommandOpen(!useUIStore.getState().commandOpen) });
  useHotkeys(
    {
      n: () => openTaskForm(),
      '?': () => setShortcutsOpen(true),
      '/': () => setCommandOpen(true),
      ...Object.fromEntries(NAV_ITEMS.map((item, i) => [String(i + 1), () => navigate(item.to)])),
    },
    !anyOpen,
  );

  // Toast (and optionally notify) when someone messages you while you're elsewhere.
  useEffect(
    () =>
      messageService.onIncoming((msg) => {
        const onThread = window.location.pathname.endsWith(`/messages/${msg.contactId}`);
        if (onThread && !document.hidden) return;
        const sender = useTeacherStore.getState().teachers.find((t) => t.id === msg.contactId);
        const name = sender?.name ?? 'Someone';
        if (!onThread) {
          pushToast({
            title: `New message from ${name}`,
            description: msg.body.length > 80 ? `${msg.body.slice(0, 80)}…` : msg.body,
            action: { label: 'Open', onClick: () => navigate(`/messages/${msg.contactId}`) },
            duration: 7000,
          });
        }
        if (useSettingsStore.getState().notificationsEnabled && document.hidden)
          notify(`Message from ${name}`, msg.body);
      }),
    [navigate, pushToast],
  );

  // Move focus to main content on route change for screen-reader users.
  useEffect(() => {
    document.getElementById('main')?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <>
      <TaskFormModal />
      <CommandPalette />
      <ShortcutsModal />
      <Celebration />
    </>
  );
}
