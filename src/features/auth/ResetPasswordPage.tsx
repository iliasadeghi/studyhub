import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { toast } from '@/stores/uiStore';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { AuthLayout } from './AuthLayout';
import { PasswordInput } from './PasswordInput';
import { authErrorMessage } from './authErrors';
import { Splash } from './guards';

/** Reached from the password-reset email (Supabase signs the user in for recovery). */
export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const status = useAuthStore((s) => s.status);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (status === 'loading') return <Splash />;

  if (status === 'signedOut') {
    return (
      <AuthLayout
        title="Link expired"
        subtitle="This reset link is invalid or has already been used."
        footer={
          <Link to="/forgot-password" className="font-semibold text-accent-text hover:underline">
            Send a new link
          </Link>
        }
      >
        {null}
      </AuthLayout>
    );
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return setError('Use at least 8 characters.');
    if (password !== confirm) return setError('The two passwords don’t match.');
    setBusy(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (err) return setError(authErrorMessage(err.message));
    useAuthStore.getState().set({ recovery: false });
    toast({ variant: 'success', title: 'Password updated' });
    navigate('/', { replace: true });
  };

  return (
    <AuthLayout title="Choose a new password">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="New password" hint="At least 8 characters.">
          {(id) => (
            <PasswordInput
              id={id}
              autoComplete="new-password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}
        </Field>
        <Field label="Confirm new password">
          {(id) => (
            <PasswordInput
              id={id}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          )}
        </Field>
        {error && (
          <p
            role="alert"
            className="rounded-md bg-danger-soft px-3 py-2 text-sm font-medium text-danger-text"
          >
            {error}
          </p>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? 'Saving…' : 'Save new password'}
        </Button>
      </form>
    </AuthLayout>
  );
}
