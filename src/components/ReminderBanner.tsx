import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { BellRing, X } from 'lucide-react';
import { useTaskStore } from '@/stores/taskStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useNow } from '@/hooks/useNow';
import { notify } from '@/services/notifications';
import { pluralize } from '@/utils/format';

const DISMISS_KEY = 'studyhub:reminder-dismissed';
const NOTIFIED_KEY = 'studyhub:notified';

function readSession(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Banner for open tasks due within the next 24 hours (+ optional browser notifications). */
export function ReminderBanner() {
  const tasks = useTaskStore((s) => s.tasks);
  const notificationsEnabled = useSettingsStore((s) => s.notificationsEnabled);
  const now = useNow();
  const [dismissedKey, setDismissedKey] = useState(() => readSession(DISMISS_KEY));

  const dueSoon = useMemo(() => {
    const limit = now.getTime() + 24 * 3600_000;
    return tasks
      .filter((t) => {
        const due = new Date(t.dueAt).getTime();
        return t.status !== 'done' && due >= now.getTime() && due <= limit;
      })
      .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  }, [tasks, now]);

  const signature = dueSoon.map((t) => t.id).join(',');

  useEffect(() => {
    if (!notificationsEnabled || dueSoon.length === 0) return;
    const already = new Set((readSession(NOTIFIED_KEY) ?? '').split(','));
    const fresh = dueSoon.filter((t) => !already.has(t.id));
    if (fresh.length === 0) return;
    notify(
      fresh.length === 1
        ? `Due soon: ${fresh[0].title}`
        : `${fresh.length} tasks due within 24 hours`,
      fresh.map((t) => t.title).join(' · '),
    );
    try {
      sessionStorage.setItem(NOTIFIED_KEY, [...already, ...fresh.map((t) => t.id)].join(','));
    } catch {
      /* ignore */
    }
  }, [dueSoon, notificationsEnabled]);

  const visible = dueSoon.length > 0 && dismissedKey !== signature;

  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden print:hidden"
          role="status"
        >
          <div className="mx-auto max-w-[1200px] px-4 pt-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 rounded-lg border border-warning/30 bg-warning-soft px-4 py-2.5 text-sm">
              <BellRing className="h-4 w-4 shrink-0 text-warning" aria-hidden />
              <p className="min-w-0 flex-1">
                <span className="font-semibold">
                  {pluralize(dueSoon.length, 'task')} due in the next 24 hours
                </span>
                <span className="hidden text-muted sm:inline"> — next up: {dueSoon[0].title}</span>
              </p>
              <Link
                to="/tasks"
                className="shrink-0 rounded-sm px-2 py-1 font-semibold text-accent-text hover:bg-accent-soft"
              >
                View
              </Link>
              <button
                type="button"
                aria-label="Dismiss reminder"
                onClick={() => {
                  setDismissedKey(signature);
                  try {
                    sessionStorage.setItem(DISMISS_KEY, signature);
                  } catch {
                    /* ignore */
                  }
                }}
                className="shrink-0 rounded-sm p-1 text-muted hover:bg-surface hover:text-fg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
