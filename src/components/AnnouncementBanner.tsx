import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, Megaphone, X } from 'lucide-react';
import type { AnnouncementTone } from '@/types';
import { useSchoolStore } from '@/stores/schoolStore';
import { cn } from '@/utils/cn';

const KEY = 'studyhub:dismissed-announcement';

const TONES: Record<AnnouncementTone, { cls: string; icon: typeof Info }> = {
  info: { cls: 'border-info/30 bg-info-soft text-info', icon: Megaphone },
  success: { cls: 'border-success/30 bg-success-soft text-success', icon: CheckCircle2 },
  warning: { cls: 'border-warning/40 bg-warning-soft text-warning', icon: Info },
  danger: { cls: 'border-danger/30 bg-danger-soft text-danger-text', icon: AlertTriangle },
};

function readDismissed(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/** School-wide announcement set by the admin. Dismissing hides it until the text changes. */
export function AnnouncementBanner() {
  const text = useSchoolStore((s) => s.settings.announcement);
  const tone = useSchoolStore((s) => s.settings.announcementTone);
  const stamp = useSchoolStore((s) => s.settings.announcementAt ?? s.settings.announcement);
  const [dismissed, setDismissed] = useState(readDismissed);

  if (!text.trim() || dismissed === stamp) return null;
  const { cls, icon: Icon } = TONES[tone] ?? TONES.info;

  const dismiss = () => {
    setDismissed(stamp);
    try {
      localStorage.setItem(KEY, stamp);
    } catch {
      /* private mode: dismiss for this visit only */
    }
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 pt-4 sm:px-6 lg:px-8 print:hidden">
      <div
        role="status"
        className={cn('flex items-start gap-3 rounded-lg border px-4 py-3 text-sm', cls)}
      >
        <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <p className="min-w-0 flex-1 font-medium break-words whitespace-pre-line text-fg">{text}</p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss announcement"
          className="-m-1 rounded p-1 opacity-70 hover:opacity-100"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
