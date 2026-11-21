import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, GraduationCap, MailCheck } from 'lucide-react';
import type { UserRole } from '@/types';
import { appUrl, supabase } from '@/lib/supabase';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Field';
import { AuthLayout } from './AuthLayout';
import { PasswordInput } from './PasswordInput';
import { authErrorMessage } from './authErrors';

const ROLES: { id: UserRole; label: string; hint: string; icon: typeof GraduationCap }[] = [
  {
    id: 'student',
    label: "I'm a student",
    hint: 'Track tasks, join classes, message teachers',
    icon: GraduationCap,
  },
  {
    id: 'teacher',
    label: "I'm a teacher",
    hint: 'Create classes, share notes, answer students',
    icon: BookOpen,
  },
];

export default function SignupPage() {
  const [role, setRole] = useState<UserRole>('student');
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('10');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sentTo, setSentTo] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError('Enter your name.');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Enter a valid email address.');
    if (password.length < 8) return setError('Use at least 8 characters for your password.');
    if (password !== confirm) return setError('The two passwords don’t match.');
    setBusy(true);
    const { data, error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: appUrl(),
        data: { full_name: name.trim(), role, grade: role === 'student' ? grade : null },
      },
    });
    setBusy(false);
    if (err) return setError(authErrorMessage(err.message));
    // With email confirmation on, there's no session until the link is clicked.
    if (!data.session) setSentTo(email.trim());
  };

  if (sentTo) {
    return (
      <AuthLayout
        title="Confirm your email"
        subtitle={`We sent a confirmation link to ${sentTo}.`}
        footer={
          <Link to="/login" className="font-semibold text-accent-text hover:underline">
            Back to log in
          </Link>
        }
      >
        <div className="flex items-start gap-3 rounded-lg border border-border bg-surface p-4 text-sm">
          <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden />
          <p>
            Click the link in the email to activate your account. You'll be signed in automatically.
            Check your spam folder if it doesn't arrive in a few minutes.
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="It's free and takes less than a minute."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-accent-text hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">I am signing up as</legend>
          <div className="grid grid-cols-2 gap-2">
            {ROLES.map(({ id, label, hint, icon: Icon }) => (
              <label
                key={id}
                className={cn(
                  'flex cursor-pointer flex-col gap-1 rounded-lg border p-3 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent',
                  role === id
                    ? 'border-accent bg-accent-soft'
                    : 'border-border hover:border-border-strong',
                )}
              >
                <input
                  type="radio"
                  name="role"
                  value={id}
                  checked={role === id}
                  onChange={() => setRole(id)}
                  className="sr-only"
                />
                <span
                  className={cn(
                    'flex items-center gap-2 text-sm font-bold',
                    role === id && 'text-accent-text',
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden /> {label}
                </span>
                <span className="text-xs text-muted">{hint}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className={cn('grid gap-4', role === 'student' && 'grid-cols-[2fr_1fr]')}>
          <Field label="Full name">
            {(id) => (
              <Input
                id={id}
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={role === 'teacher' ? 'Ms. Rivera' : 'Maya Johnson'}
                className="h-11"
              />
            )}
          </Field>
          {role === 'student' && (
            <Field label="Grade">
              {(id) => (
                <Select
                  id={id}
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="h-11"
                >
                  {['9', '10', '11', '12'].map((g) => (
                    <option key={g} value={g}>
                      Grade {g}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          )}
        </div>
        <Field label="Email">
          {(id) => (
            <Input
              id={id}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@school.edu"
              className="h-11"
            />
          )}
        </Field>
        <Field label="Password" hint="At least 8 characters.">
          {(id) => (
            <PasswordInput
              id={id}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}
        </Field>
        <Field label="Confirm password">
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
          {busy ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AuthLayout>
  );
}
