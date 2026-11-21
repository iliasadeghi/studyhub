import type { ReactNode } from 'react';
import { CalendarDays, CheckSquare, MessageCircle, ShieldCheck } from 'lucide-react';
import { Logo } from '@/layouts/Logo';
import { isSupabaseConfigured } from '@/lib/supabase';

const FEATURES = [
  { icon: CheckSquare, text: 'Know exactly what to do first with smart priorities' },
  { icon: CalendarDays, text: 'Plan your week and get study plans before tests' },
  { icon: MessageCircle, text: 'Message your teachers in real time' },
  { icon: ShieldCheck, text: 'Your data is private to your account' },
];

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <aside
        className="relative hidden overflow-hidden p-12 text-white lg:flex lg:flex-col lg:justify-between"
        style={{ background: 'linear-gradient(140deg, #4547c9 0%, #5b5bd6 45%, #0e8577 140%)' }}
      >
        <div
          aria-hidden
          className="absolute -top-32 -right-24 h-96 w-96 rounded-full bg-white/10 blur-2xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-40 -left-24 h-[28rem] w-[28rem] rounded-full bg-white/10 blur-3xl"
        />
        <div className="relative flex items-center gap-2.5 text-lg font-extrabold">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-white/15">🎓</span>{' '}
          StudyHub
        </div>
        <div className="relative max-w-md">
          <h2 className="text-4xl leading-tight font-extrabold tracking-tight">
            Your classes, tasks and teachers, in one calm place.
          </h2>
          <ul className="mt-8 space-y-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-white/90">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-white/15">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-white/70">
          Built for high school students and teachers.
        </p>
      </aside>

      <main className="flex flex-col items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1.5 text-muted">{subtitle}</p>}
          {!isSupabaseConfigured && (
            <p
              role="alert"
              className="mt-4 rounded-md border border-warning/40 bg-warning-soft p-3 text-sm"
            >
              The backend isn't configured yet. Add <code>VITE_SUPABASE_URL</code> and{' '}
              <code>VITE_SUPABASE_ANON_KEY</code> to <code>.env.local</code> and restart the dev
              server.
            </p>
          )}
          <div className="mt-6">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-muted">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
