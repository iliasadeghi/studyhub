import { useState, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Misc';
import { cn } from '@/utils/cn';

export function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Card className="flex flex-col items-center gap-3 py-10 text-center">
      <AlertTriangle className="h-6 w-6 text-danger-text" aria-hidden />
      <div>
        <p className="font-bold">Couldn't load this page</p>
        <p className="mt-1 text-sm text-muted">{message}</p>
      </div>
      <Button
        variant="secondary"
        leftIcon={<RefreshCw className="h-4 w-4" aria-hidden />}
        onClick={onRetry}
      >
        Try again
      </Button>
    </Card>
  );
}

export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2" role="status" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-14" />
      ))}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'accent',
  onClick,
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon: ReactNode;
  tone?: 'accent' | 'warning' | 'success' | 'info' | 'danger';
  onClick?: () => void;
}) {
  const tones = {
    accent: 'bg-accent-soft text-accent-text',
    warning: 'bg-warning-soft text-warning',
    success: 'bg-success-soft text-success',
    info: 'bg-info-soft text-info',
    danger: 'bg-danger-soft text-danger-text',
  };
  const body = (
    <>
      <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-md', tones[tone])}>
        {icon}
      </span>
      <div className="min-w-0 text-left">
        <p className="text-2xl font-extrabold tabular-nums">{value}</p>
        <p className="truncate text-sm font-semibold">{label}</p>
        {hint && <p className="truncate text-xs text-muted">{hint}</p>}
      </div>
    </>
  );
  return onClick ? (
    <Card interactive className="p-0">
      <button type="button" onClick={onClick} className="flex w-full items-center gap-3 p-4">
        {body}
      </button>
    </Card>
  ) : (
    <Card className="flex items-center gap-3 p-4">{body}</Card>
  );
}

export function ConfirmModal({
  open,
  title,
  body,
  confirmLabel,
  danger,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  body: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => Promise<unknown> | void;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await onConfirm();
              setBusy(false);
              onClose();
            }}
          >
            {busy ? 'Working…' : confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-sm text-muted">{body}</div>
    </Modal>
  );
}
