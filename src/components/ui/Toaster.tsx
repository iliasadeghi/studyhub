import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Info, PartyPopper, X, XCircle } from 'lucide-react';
import { useUIStore, type Toast } from '@/stores/uiStore';
import { cn } from '@/utils/cn';

const icons = {
  default: <Info className="h-5 w-5 text-info" />,
  success: <CheckCircle2 className="h-5 w-5 text-success" />,
  error: <XCircle className="h-5 w-5 text-danger" />,
  celebrate: <PartyPopper className="h-5 w-5 text-accent" />,
};

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useUIStore((s) => s.dismissToast);
  useEffect(() => {
    const id = window.setTimeout(() => dismiss(toast.id), toast.duration);
    return () => window.clearTimeout(id);
  }, [toast.id, toast.duration, dismiss]);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, transition: { duration: 0.15 } }}
      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
      className={cn(
        'pointer-events-auto flex w-full items-start gap-3 rounded-lg border border-border bg-surface p-3.5 shadow-pop sm:w-96',
      )}
    >
      <span className="mt-0.5 shrink-0">{icons[toast.variant]}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{toast.title}</p>
        {toast.description && <p className="mt-0.5 text-sm text-muted">{toast.description}</p>}
      </div>
      {toast.action && (
        <button
          type="button"
          onClick={() => {
            toast.action?.onClick();
            dismiss(toast.id);
          }}
          className="shrink-0 rounded-sm px-2 py-1 text-sm font-bold text-accent-text hover:bg-accent-soft"
        >
          {toast.action.label}
        </button>
      )}
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => dismiss(toast.id)}
        className="shrink-0 rounded-sm p-1 text-muted hover:bg-surface-2 hover:text-fg"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.li>
  );
}

export function Toaster() {
  const toasts = useUIStore((s) => s.toasts);
  return (
    <div
      aria-live="polite"
      aria-relevant="additions"
      className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex justify-center px-4 md:right-6 md:bottom-6 md:left-auto md:justify-end md:px-0"
    >
      <ol className="flex w-full flex-col items-center gap-2 md:items-end">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} />
          ))}
        </AnimatePresence>
      </ol>
    </div>
  );
}
