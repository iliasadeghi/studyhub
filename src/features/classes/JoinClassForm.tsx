import { useState, type FormEvent } from 'react';
import { KeyRound } from 'lucide-react';
import { useClassStore } from '@/stores/classStore';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { loadUserData } from '@/services/userData';
import { Input } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

/** Students: join a class with the code their teacher shared. */
export function JoinClassForm({
  onJoined,
  autoFocus,
}: {
  onJoined?: (classId: string) => void;
  autoFocus?: boolean;
}) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pushToast = useUIStore((s) => s.pushToast);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const clean = code.replace(/\s+/g, '').toUpperCase();
    if (clean.length !== 6) return setError('Class codes are 6 characters, like 7F3A9C.');
    setBusy(true);
    setError('');
    try {
      const classId = await useClassStore.getState().joinClass(clean);
      // Reload so the class, its teacher, notes and office hours all appear.
      const profile = useAuthStore.getState().profile;
      if (profile) await loadUserData(profile);
      const joined = useClassStore.getState().classes.find((c) => c.id === classId);
      pushToast({ variant: 'success', title: 'Joined class', description: joined?.name });
      setCode('');
      onJoined?.(classId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not join the class.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-2" noValidate>
      <label htmlFor="join-code" className="text-sm font-semibold">
        Class code
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <KeyRound
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <Input
            id="join-code"
            autoFocus={autoFocus}
            data-autofocus
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError('');
            }}
            placeholder="e.g. 7F3A9C"
            maxLength={8}
            autoComplete="off"
            aria-invalid={!!error}
            aria-describedby={error ? 'join-code-error' : 'join-code-hint'}
            className="h-11 pl-9 font-mono text-base tracking-[0.2em] uppercase"
          />
        </div>
        <Button type="submit" size="lg" disabled={busy}>
          {busy ? 'Joining…' : 'Join'}
        </Button>
      </div>
      {error ? (
        <p id="join-code-error" role="alert" className="text-sm font-medium text-danger-text">
          {error}
        </p>
      ) : (
        <p id="join-code-hint" className="text-xs text-muted">
          Ask your teacher for the 6-character code.
        </p>
      )}
    </form>
  );
}

export function JoinClassModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Join a class"
      description="Enter the code your teacher gave you."
      size="sm"
    >
      {open && (
        <div className="pb-2">
          <JoinClassForm onJoined={onClose} />
        </div>
      )}
    </Modal>
  );
}
