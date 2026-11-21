import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckSquare,
  MessageCircle,
  Rocket,
} from 'lucide-react';
import { useAuthStore, useProfile } from '@/stores/authStore';
import { useClassStore } from '@/stores/classStore';
import { supabase } from '@/lib/supabase';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Field';
import { Logo } from '@/layouts/Logo';
import { ColorPicker, ClassForm } from '@/features/classes/ClassFormModal';
import { JoinClassForm } from '@/features/classes/JoinClassForm';
import type { SubjectColor } from '@/types';

const STEPS = ['About you', 'Your classes', 'All set'];

/** First-time setup after sign-up. */
export default function OnboardingPage() {
  const navigate = useNavigate();
  const profile = useProfile();
  const classes = useClassStore((s) => s.classes);
  const teacher = profile.role === 'teacher';
  const [step, setStep] = useState(0);
  const [name, setName] = useState(profile.fullName);
  const [grade, setGrade] = useState(profile.grade ?? '10');
  const [color, setColor] = useState<SubjectColor>(profile.avatarColor);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('What should we call you?');
    setBusy(true);
    const ok = await useAuthStore.getState().updateProfile({
      fullName: name.trim(),
      grade: teacher ? null : grade,
      avatarColor: color,
    });
    setBusy(false);
    if (ok) {
      setError('');
      setStep(1);
    }
  };

  const finish = async () => {
    setBusy(true);
    const ok = await useAuthStore.getState().updateProfile({ onboarded: true });
    setBusy(false);
    if (ok) navigate('/', { replace: true });
  };

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-40 h-[28rem] w-[28rem] rounded-full bg-accent-soft blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -bottom-40 h-[28rem] w-[28rem] rounded-full blur-3xl"
        style={{ background: 'color-mix(in srgb, var(--c-cyan) 16%, transparent)' }}
      />

      <main className="relative w-full max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <Logo />
          <button
            type="button"
            onClick={() => void supabase.auth.signOut({ scope: 'local' })}
            className="rounded-sm text-sm font-semibold text-muted hover:text-fg"
          >
            Sign out
          </button>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 shadow-pop sm:p-8">
          <ol className="mb-6 flex items-center gap-2" aria-label="Progress">
            {STEPS.map((s, i) => (
              <li
                key={s}
                className="flex flex-1 flex-col gap-1.5"
                aria-current={i === step ? 'step' : undefined}
              >
                <span
                  className={cn(
                    'h-1.5 rounded-full transition-colors duration-300',
                    i <= step ? 'bg-accent' : 'bg-surface-3',
                  )}
                />
                <span
                  className={cn('text-xs font-semibold', i === step ? 'text-fg' : 'text-muted')}
                >
                  {s}
                </span>
              </li>
            ))}
          </ol>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
            >
              {step === 0 && (
                <form onSubmit={(e) => void saveProfile(e)} className="space-y-5" noValidate>
                  <div>
                    <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                      Welcome to StudyHub 👋
                    </h1>
                    <p className="mt-2 text-muted">
                      {teacher
                        ? 'Set up your teacher profile. Your students will see your name and color.'
                        : 'Let’s set up your profile. It takes less than a minute.'}
                    </p>
                  </div>
                  <div className={cn('grid gap-4', !teacher && 'sm:grid-cols-[2fr_1fr]')}>
                    <Field label={teacher ? 'Name students will see' : 'Your name'}>
                      {(id) => (
                        <Input
                          id={id}
                          autoFocus
                          value={name}
                          onChange={(e) => {
                            setName(e.target.value);
                            setError('');
                          }}
                          placeholder={teacher ? 'Ms. Rivera' : 'Maya'}
                          className="h-12 text-base"
                        />
                      )}
                    </Field>
                    {!teacher && (
                      <Field label="Grade">
                        {(id) => (
                          <Select
                            id={id}
                            value={grade}
                            onChange={(e) => setGrade(e.target.value)}
                            className="h-12"
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
                  <ColorPicker legend="Profile color" value={color} onChange={setColor} />
                  {error && (
                    <p role="alert" className="text-sm font-medium text-danger-text">
                      {error}
                    </p>
                  )}
                  <div className="flex justify-end pt-2">
                    <Button
                      type="submit"
                      size="lg"
                      disabled={busy}
                      rightIcon={<ArrowRight className="h-4 w-4" />}
                    >
                      Continue
                    </Button>
                  </div>
                </form>
              )}

              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <h1 className="text-2xl font-extrabold tracking-tight">
                      {teacher ? 'Create your first class' : 'Join your classes'}
                    </h1>
                    <p className="mt-1 text-muted">
                      {teacher
                        ? 'You’ll get a join code to share with your students. You can add more classes later.'
                        : 'Enter the code your teacher shared. You can join more classes later.'}
                    </p>
                  </div>
                  {classes.length > 0 && (
                    <ul className="flex flex-wrap gap-2" aria-label="Your classes">
                      {classes.map((c) => (
                        <li
                          key={c.id}
                          className="rounded-full bg-accent-soft px-3 py-1 text-sm font-semibold text-accent-text"
                        >
                          {c.name}
                          {teacher && (
                            <span className="ml-2 font-mono text-xs opacity-80">{c.joinCode}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                  {teacher ? (
                    <>
                      <ClassForm
                        key={classes.length}
                        initial={null}
                        formId="onboarding-class"
                        onDone={() => undefined}
                      />
                      <div className="flex justify-end">
                        <Button type="submit" form="onboarding-class" variant="secondary">
                          {classes.length ? 'Create another class' : 'Create class'}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <JoinClassForm autoFocus />
                  )}
                  <div className="flex items-center justify-between border-t border-border pt-5">
                    <Button
                      variant="ghost"
                      leftIcon={<ArrowLeft className="h-4 w-4" />}
                      onClick={() => setStep(0)}
                    >
                      Back
                    </Button>
                    <Button
                      size="lg"
                      onClick={() => setStep(2)}
                      rightIcon={<ArrowRight className="h-4 w-4" />}
                    >
                      {classes.length ? 'Continue' : 'Skip for now'}
                    </Button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5 text-center">
                  <motion.div
                    initial={{ scale: 0.6, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 14 }}
                    className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-accent text-accent-fg shadow-card"
                  >
                    <Rocket className="h-8 w-8" aria-hidden />
                  </motion.div>
                  <div>
                    <h1 className="text-2xl font-extrabold tracking-tight">
                      You’re all set, {name.trim().split(' ')[0]}!
                    </h1>
                    <p className="mt-1 text-muted">Here’s what you can do next:</p>
                  </div>
                  <ul className="grid gap-3 text-left sm:grid-cols-3">
                    {(teacher
                      ? [
                          {
                            icon: CheckSquare,
                            title: 'Share your code',
                            text: 'Students join your class with it.',
                          },
                          {
                            icon: CalendarDays,
                            title: 'Office hours',
                            text: 'Set them in Settings so students can book.',
                          },
                          {
                            icon: MessageCircle,
                            title: 'Answer questions',
                            text: 'Messages arrive in real time.',
                          },
                        ]
                      : [
                          {
                            icon: CheckSquare,
                            title: 'Add tasks',
                            text: 'Press N anytime. We’ll rank what to do first.',
                          },
                          {
                            icon: CalendarDays,
                            title: 'Plan your week',
                            text: 'Drag tasks on the calendar; get study plans.',
                          },
                          {
                            icon: MessageCircle,
                            title: 'Ask teachers',
                            text: 'Message them and get replies in real time.',
                          },
                        ]
                    ).map(({ icon: Icon, title, text }) => (
                      <li key={title} className="rounded-md border border-border p-3">
                        <Icon className="mb-2 h-5 w-5 text-accent-text" aria-hidden />
                        <p className="text-sm font-bold">{title}</p>
                        <p className="text-xs text-muted">{text}</p>
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center justify-between pt-2">
                    <Button
                      variant="ghost"
                      leftIcon={<ArrowLeft className="h-4 w-4" />}
                      onClick={() => setStep(1)}
                    >
                      Back
                    </Button>
                    <Button size="lg" disabled={busy} onClick={() => void finish()}>
                      Go to my dashboard
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
