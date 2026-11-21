import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckSquare,
  MessageCircle,
  Rocket,
  Sparkles,
} from 'lucide-react';
import type { ClassItem, Teacher } from '@/types';
import { useSettingsStore } from '@/stores/settingsStore';
import { resetToSampleData, startFresh } from '@/services/storage';
import { uid } from '@/utils/id';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Field';
import { Logo } from '@/layouts/Logo';
import { ClassesStep } from './ClassesStep';
import { newDraft, type DraftClass } from './draft';

const STEPS = ['About you', 'Your classes', 'All set'];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const settings = useSettingsStore();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(settings.name);
  const [grade, setGrade] = useState(settings.grade);
  const [drafts, setDrafts] = useState<DraftClass[]>([newDraft()]);
  const [error, setError] = useState('');
  const [entered] = useState(() => settings.onboarded);

  if (entered) return <Navigate to="/" replace />;

  const valid = drafts.filter((d) => d.name.trim());

  const explore = () => {
    resetToSampleData();
    settings.update({ name: name.trim() || 'Alex', grade, onboarded: true });
    navigate('/');
  };

  const finish = () => {
    const teachers: Teacher[] = [];
    const classes: ClassItem[] = valid.map((d, i) => {
      let teacherId: string | null = null;
      if (d.teacher.trim()) {
        const existing = teachers.find(
          (t) => t.name.toLowerCase() === d.teacher.trim().toLowerCase(),
        );
        const t = existing ?? {
          id: uid('teacher'),
          name: d.teacher.trim(),
          subjects: [],
          email: '',
          officeHours: [],
          preferredContact: 'email' as const,
          bio: '',
        };
        t.subjects.push(d.name.trim());
        if (!existing) teachers.push(t);
        teacherId = t.id;
      }
      return {
        id: uid('class'),
        name: d.name.trim(),
        subject: d.name.trim(),
        teacherId,
        color: d.color,
        room: d.room.trim(),
        schedule: {
          days: [1, 2, 3, 4, 5],
          start: `${8 + i}:00`.padStart(5, '0'),
          end: `${8 + i}:50`.padStart(5, '0'),
        },
      };
    });
    startFresh(classes, teachers);
    settings.update({ name: name.trim(), grade, onboarded: true });
    navigate('/');
  };

  const next = (e?: FormEvent) => {
    e?.preventDefault();
    if (step === 0 && !name.trim()) return setError('What should we call you?');
    if (step === 1 && valid.length === 0)
      return setError('Add at least one class — or explore with sample data.');
    setError('');
    if (step === 2) return finish();
    setStep((s) => s + 1);
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
            onClick={explore}
            className="rounded-sm text-sm font-semibold text-accent-text hover:underline"
          >
            Explore with sample data →
          </button>
        </div>

        <form
          onSubmit={next}
          className="rounded-xl border border-border bg-surface p-6 shadow-pop sm:p-8"
          noValidate
        >
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
                <div className="space-y-5">
                  <div>
                    <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                      Welcome to StudyHub 👋
                    </h1>
                    <p className="mt-2 text-muted">
                      Your tasks, notes, classes and teachers — organized in one calm place. Let’s
                      set you up in under a minute.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr]">
                    <Field label="What’s your first name?">
                      {(id) => (
                        <Input
                          id={id}
                          data-autofocus
                          autoFocus
                          value={name}
                          onChange={(e) => {
                            setName(e.target.value);
                            setError('');
                          }}
                          placeholder="e.g. Maya"
                          autoComplete="given-name"
                          className="h-12 text-base"
                        />
                      )}
                    </Field>
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
                  </div>
                </div>
              )}
              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <h1 className="text-2xl font-extrabold tracking-tight">Add your classes</h1>
                    <p className="mt-1 text-muted">
                      Each class gets its own color. You can change everything later in Settings.
                    </p>
                  </div>
                  <ClassesStep
                    value={drafts}
                    onChange={(v) => {
                      setDrafts(v);
                      setError('');
                    }}
                  />
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
                      You’re all set, {name.trim()}!
                    </h1>
                    <p className="mt-1 text-muted">
                      {valid.length} class{valid.length === 1 ? '' : 'es'} ready to go. Here’s what
                      you can do:
                    </p>
                  </div>
                  <ul className="grid gap-3 text-left sm:grid-cols-3">
                    {[
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
                        text: 'Message, email or book office hours.',
                      },
                    ].map(({ icon: Icon, title, text }) => (
                      <li key={title} className="rounded-md border border-border p-3">
                        <Icon className="mb-2 h-5 w-5 text-accent-text" aria-hidden />
                        <p className="text-sm font-bold">{title}</p>
                        <p className="text-xs text-muted">{text}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {error && (
            <p role="alert" className="mt-4 text-sm font-medium text-danger-text">
              {error}
            </p>
          )}

          <div className="mt-8 flex items-center justify-between gap-3">
            {step > 0 ? (
              <Button
                variant="ghost"
                leftIcon={<ArrowLeft className="h-4 w-4" />}
                onClick={() => setStep((s) => s - 1)}
              >
                Back
              </Button>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                <Sparkles className="h-3.5 w-3.5" aria-hidden /> No account needed — saved on this
                device
              </span>
            )}
            <Button
              type="submit"
              size="lg"
              rightIcon={step < 2 ? <ArrowRight className="h-4 w-4" /> : undefined}
            >
              {step === 2 ? 'Go to my dashboard' : 'Continue'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
