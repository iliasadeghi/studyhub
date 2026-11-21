import { useState, type FormEvent } from 'react';
import type { ClassItem, SubjectColor } from '@/types';
import { useClassStore } from '@/stores/classStore';
import { useUIStore } from '@/stores/uiStore';
import { SUBJECT_COLORS, SUBJECT_COLOR_LABELS, subjectVars } from '@/utils/colors';
import { WEEKDAY_SHORT } from '@/utils/dates';
import { cn } from '@/utils/cn';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { suggestColor } from './art/pickArt';

const EMPTY: Pick<ClassItem, 'name' | 'subject' | 'color' | 'room' | 'schedule'> = {
  name: '',
  subject: '',
  color: 'blue',
  room: '',
  schedule: { days: [1, 3, 5], start: '09:00', end: '09:50' },
};

export function ColorPicker({
  value,
  onChange,
  legend = 'Color',
}: {
  value: SubjectColor;
  onChange: (c: SubjectColor) => void;
  legend?: string;
}) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-semibold">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {SUBJECT_COLORS.map((c) => (
          <label key={c} className="relative cursor-pointer" title={SUBJECT_COLOR_LABELS[c]}>
            <input
              type="radio"
              name={`color-${legend}`}
              value={c}
              checked={value === c}
              onChange={() => onChange(c)}
              className="peer sr-only"
            />
            <span className="sr-only">{SUBJECT_COLOR_LABELS[c]}</span>
            <span
              aria-hidden
              className="block h-8 w-8 rounded-full ring-offset-2 ring-offset-surface transition-transform peer-checked:scale-110 peer-checked:ring-2 peer-checked:ring-fg peer-focus-visible:ring-2 peer-focus-visible:ring-accent"
              style={{ background: subjectVars(c).solid }}
            />
          </label>
        ))}
      </div>
    </fieldset>
  );
}

type ClassDraft = Pick<ClassItem, 'name' | 'subject' | 'color' | 'room' | 'schedule'>;

export function ClassForm({
  initial,
  onDone,
  formId = 'class-form',
}: {
  initial: ClassItem | null;
  onDone: (saved?: ClassItem) => void;
  formId?: string;
}) {
  const pushToast = useUIStore((s) => s.pushToast);
  const [draft, setDraft] = useState<ClassDraft>(initial ?? EMPTY);
  const [busy, setBusy] = useState(false);
  // New classes pick a color from the subject until the teacher chooses one.
  const [colorTouched, setColorTouched] = useState(initial !== null);
  const autoColor = (name: string, subject: string) => {
    if (colorTouched) return;
    const c = suggestColor(`${subject} ${name}`);
    if (c) setDraft((d) => ({ ...d, color: c }));
  };
  const [error, setError] = useState('');
  const set = <K extends keyof ClassDraft>(k: K, v: ClassDraft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));
  const toggleDay = (d: number) =>
    set('schedule', {
      ...draft.schedule,
      days: draft.schedule.days.includes(d)
        ? draft.schedule.days.filter((x) => x !== d)
        : [...draft.schedule.days, d].sort(),
    });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!draft.name.trim()) return setError('Class name is required.');
    const data: ClassDraft = {
      ...draft,
      name: draft.name.trim(),
      subject: draft.subject.trim() || draft.name.trim(),
      room: draft.room.trim(),
    };
    const store = useClassStore.getState();
    if (initial) {
      store.updateClass(initial.id, data);
      pushToast({ variant: 'success', title: 'Class updated', description: data.name });
      onDone({ ...initial, ...data });
      return;
    }
    setBusy(true);
    try {
      const created = await store.addClass(data);
      pushToast({
        variant: 'success',
        title: 'Class created',
        description: `Share join code ${created.joinCode} with your students.`,
        duration: 8000,
      });
      onDone(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the class.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form id={formId} onSubmit={(e) => void submit(e)} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Class name">
          {(id) => (
            <Input
              id={id}
              data-autofocus
              value={draft.name}
              onChange={(e) => {
                set('name', e.target.value);
                autoColor(e.target.value, draft.subject);
                setError('');
              }}
              placeholder="e.g. Chemistry"
              aria-invalid={!!error}
            />
          )}
        </Field>
        <Field label="Subject" hint="Used for grouping, e.g. Science">
          {(id) => (
            <Input
              id={id}
              value={draft.subject}
              onChange={(e) => {
                set('subject', e.target.value);
                autoColor(draft.name, e.target.value);
              }}
              placeholder="Science"
            />
          )}
        </Field>
      </div>
      {error && (
        <p role="alert" className="text-sm font-medium text-danger-text">
          {error}
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Room">
          {(id) => (
            <Input
              id={id}
              value={draft.room}
              onChange={(e) => set('room', e.target.value)}
              placeholder="Room 101"
            />
          )}
        </Field>
      </div>
      <fieldset>
        <legend className="mb-1.5 text-sm font-semibold">Meets on</legend>
        <div className="flex flex-wrap gap-1.5">
          {WEEKDAY_SHORT.map((d, i) => (
            <button
              key={d}
              type="button"
              aria-pressed={draft.schedule.days.includes(i)}
              onClick={() => toggleDay(i)}
              className={cn(
                'h-9 w-12 rounded-full border text-sm font-semibold transition-colors',
                draft.schedule.days.includes(i)
                  ? 'border-accent bg-accent-soft text-accent-text'
                  : 'border-border text-muted hover:text-fg',
              )}
            >
              {d}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Starts">
          {(id) => (
            <Input
              id={id}
              type="time"
              value={draft.schedule.start}
              onChange={(e) => set('schedule', { ...draft.schedule, start: e.target.value })}
            />
          )}
        </Field>
        <Field label="Ends">
          {(id) => (
            <Input
              id={id}
              type="time"
              value={draft.schedule.end}
              onChange={(e) => set('schedule', { ...draft.schedule, end: e.target.value })}
            />
          )}
        </Field>
      </div>
      <ColorPicker
        value={draft.color}
        onChange={(c) => {
          setColorTouched(true);
          set('color', c);
        }}
      />
    </form>
  );
}

export function ClassFormModal({
  open,
  onClose,
  classItem,
}: {
  open: boolean;
  onClose: () => void;
  classItem: ClassItem | null;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={classItem ? 'Edit class' : 'Create a class'}
      description={classItem ? undefined : 'Students join with a code you share with them.'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="class-form">
            {classItem ? 'Save' : 'Create class'}
          </Button>
        </>
      }
    >
      {open && (
        <ClassForm key={classItem?.id ?? 'new'} initial={classItem} onDone={() => onClose()} />
      )}
    </Modal>
  );
}
