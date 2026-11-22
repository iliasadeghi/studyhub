import { useState, type FormEvent } from 'react';
import { Download, KeyRound, LogOut, Trash2 } from 'lucide-react';
import { downloadExport } from '@/services/storage';
import { supabase } from '@/lib/supabase';
import { useProfile } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { PasswordInput } from '@/features/auth/PasswordInput';
import { authErrorMessage } from '@/features/auth/authErrors';
import { SettingsSection } from './SettingsSection';

function ChangePasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pushToast = useUIStore((s) => s.pushToast);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return setError('Use at least 8 characters.');
    if (password !== confirm) return setError('The two passwords don’t match.');
    setBusy(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (err) return setError(authErrorMessage(err.message));
    pushToast({ variant: 'success', title: 'Password changed' });
    setPassword('');
    setConfirm('');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Change password"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="change-password" disabled={busy}>
            {busy ? 'Saving…' : 'Change password'}
          </Button>
        </>
      }
    >
      <form id="change-password" onSubmit={(e) => void submit(e)} className="space-y-4">
        <Field label="New password" hint="At least 8 characters.">
          {(id) => (
            <PasswordInput
              id={id}
              data-autofocus
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
            />
          )}
        </Field>
        <Field label="Confirm new password">
          {(id) => (
            <PasswordInput
              id={id}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                setError('');
              }}
            />
          )}
        </Field>
        {error && (
          <p role="alert" className="text-sm font-medium text-danger-text">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}

function DeleteAccountModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const profile = useProfile();
  const pushToast = useUIStore((s) => s.pushToast);
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const matches = typed.trim().toLowerCase() === profile.email.toLowerCase();

  const remove = async () => {
    setBusy(true);
    const { error } = await supabase.rpc('delete_my_account');
    if (error) {
      setBusy(false);
      pushToast({
        variant: 'error',
        title: "Couldn't delete your account",
        description: error.message,
      });
      return;
    }
    await supabase.auth.signOut({ scope: 'local' });
    pushToast({ title: 'Account deleted', description: 'Your account and data were removed.' });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Delete your account?"
      description="This permanently deletes your profile, tasks, notes, messages and bookings. It can’t be undone."
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" disabled={!matches || busy} onClick={() => void remove()}>
            {busy ? 'Deleting…' : 'Delete forever'}
          </Button>
        </>
      }
    >
      <Field label={`Type your email (${profile.email}) to confirm`}>
        {(id) => (
          <Input
            id={id}
            data-autofocus
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
          />
        )}
      </Field>
      {profile.role === 'teacher' && (
        <p className="mt-3 text-sm text-danger-text">
          Your classes, their class notes and student memberships will be deleted too.
        </p>
      )}
    </Modal>
  );
}

export function DataSection() {
  const admin = useProfile().role === 'admin';
  const [pwOpen, setPwOpen] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const pushToast = useUIStore((s) => s.pushToast);

  return (
    <SettingsSection
      id="account"
      title="Account & data"
      description="Your data is stored securely in your StudyHub account."
    >
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          leftIcon={<KeyRound className="h-4 w-4" />}
          onClick={() => setPwOpen(true)}
        >
          Change password
        </Button>
        <Button
          variant="secondary"
          leftIcon={<Download className="h-4 w-4" />}
          onClick={() => {
            downloadExport();
            pushToast({ variant: 'success', title: 'Export downloaded' });
          }}
        >
          Export my data
        </Button>
        <Button
          variant="secondary"
          leftIcon={<LogOut className="h-4 w-4" />}
          onClick={() => void supabase.auth.signOut({ scope: 'local' })}
        >
          Sign out
        </Button>
      </div>
      {!admin && (
        <div className="rounded-md border border-danger/30 bg-danger-soft/50 p-4">
          <p className="text-sm font-semibold">Danger zone</p>
          <p className="mt-0.5 mb-3 text-xs text-muted">
            Permanently delete your account and everything in it.
          </p>
          <Button
            variant="danger"
            size="sm"
            leftIcon={<Trash2 className="h-4 w-4" />}
            onClick={() => setDelOpen(true)}
          >
            Delete account
          </Button>
        </div>
      )}
      <ChangePasswordModal open={pwOpen} onClose={() => setPwOpen(false)} />
      <DeleteAccountModal open={delOpen} onClose={() => setDelOpen(false)} />
    </SettingsSection>
  );
}
