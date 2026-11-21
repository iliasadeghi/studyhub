import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Wand2 } from 'lucide-react';
import { appUrl, supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { AuthLayout } from './AuthLayout';
import { PasswordInput } from './PasswordInput';
import { authErrorMessage } from './authErrors';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'password' | 'magic'>('password');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [linkSent, setLinkSent] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) return setError('Enter your email.');
    setBusy(true);
    if (mode === 'password') {
      const { error: err } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (err) setError(authErrorMessage(err.message));
      // On success the auth provider loads the account and the route guard redirects.
    } else {
      const { error: err } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: false, emailRedirectTo: appUrl() },
      });
      if (err) setError(authErrorMessage(err.message));
      else setLinkSent(true);
    }
    setBusy(false);
  };

  if (linkSent) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle={`We sent a sign-in link to ${email}.`}
        footer={
          <button
            type="button"
            className="font-semibold text-accent-text hover:underline"
            onClick={() => setLinkSent(false)}
          >
            Use a different method
          </button>
        }
      >
        <div className="flex items-start gap-3 rounded-lg border border-border bg-surface p-4 text-sm">
          <Mail className="mt-0.5 h-5 w-5 shrink-0 text-accent-text" aria-hidden />
          <p>
            Open the link on this device to sign in. It expires in one hour. Don't see it? Check
            your spam folder.
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to your StudyHub account."
      footer={
        <>
          New to StudyHub?{' '}
          <Link to="/signup" className="font-semibold text-accent-text hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Email">
          {(id) => (
            <Input
              id={id}
              type="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@school.edu"
              className="h-11"
            />
          )}
        </Field>
        {mode === 'password' && (
          <Field label="Password">
            {(id) => (
              <PasswordInput
                id={id}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            )}
          </Field>
        )}
        {mode === 'password' && (
          <div className="-mt-1 text-right">
            <Link
              to="/forgot-password"
              className="text-sm font-semibold text-accent-text hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        )}
        {error && (
          <p
            role="alert"
            className="rounded-md bg-danger-soft px-3 py-2 text-sm font-medium text-danger-text"
          >
            {error}
          </p>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? 'Please wait…' : mode === 'password' ? 'Log in' : 'Email me a sign-in link'}
        </Button>
        <div className="relative py-1 text-center text-xs text-subtle">
          <span aria-hidden className="absolute inset-x-0 top-1/2 h-px bg-border" />
          <span className="relative bg-bg px-2">or</span>
        </div>
        <Button
          variant="secondary"
          size="lg"
          className="w-full"
          leftIcon={mode === 'password' ? <Wand2 className="h-4 w-4" /> : undefined}
          onClick={() => {
            setMode(mode === 'password' ? 'magic' : 'password');
            setError('');
          }}
        >
          {mode === 'password' ? 'Log in with an email link instead' : 'Log in with a password'}
        </Button>
      </form>
    </AuthLayout>
  );
}
