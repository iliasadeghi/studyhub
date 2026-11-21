import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import { appUrl, supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { AuthLayout } from './AuthLayout';
import { authErrorMessage } from './authErrors';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return setError('Enter your email.');
    setBusy(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: appUrl('reset-password'),
    });
    setBusy(false);
    if (err) setError(authErrorMessage(err.message));
    else setSent(true);
  };

  return (
    <AuthLayout
      title={sent ? 'Check your email' : 'Reset your password'}
      subtitle={
        sent ? undefined : "Enter your email and we'll send you a link to choose a new password."
      }
      footer={
        <Link to="/login" className="font-semibold text-accent-text hover:underline">
          Back to log in
        </Link>
      }
    >
      {sent ? (
        <div className="flex items-start gap-3 rounded-lg border border-border bg-surface p-4 text-sm">
          <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden />
          <p>
            If an account exists for {email}, a reset link is on its way. Open it on this device.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field label="Email">
            {(id) => (
              <Input
                id={id}
                type="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                className="h-11"
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
            {busy ? 'Sending…' : 'Send reset link'}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
