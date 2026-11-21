import { useState, type FormEvent } from 'react';
import type { ClassItem, SubjectColor } from '@/types';
import { useClassStore } from '@/stores/classStore';
import { useTeacherStore } from '@/stores/teacherStore';
import { useUIStore } from '@/stores/uiStore';
import { SUBJECT_COLORS, SUBJECT_COLOR_LABELS, subjectVars } from '@/utils/colors';
import { WEEKDAY_SHORT } from '@/utils/dates';
import { cn } from '@/utils/cn';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Field';

const EMPTY: Omit<ClassItem, 'id'> = {
  name: '',
  subject: '',
  teacherId: null,
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

function ClassForm({ initial, onDone }: { initial: ClassItem | null; onDone: () => void }) {
  const teachers = useTeacherStore((s) => s.teachers);
  const pushToast = useUIStore((s) => s.pushToast);
  const [draft, setDraft] = useState<Omit<ClassItem, 'id'>>(initial ?? EMPTY);
  const [newTeacher, setNewTeacher] = useState('');
  const [error, setError] = useState('');
  const set = <K extends keyof typeof draft>(k: K, v: (typeof draft)[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));
  const toggleDay = (d: number) =>
    set('schedule', {
      ...draft.schedule,
      days: draft.schedule.days.includes(d)
        ? draft.schedule.days.filter((x) => x !== d)
        : [...draft.schedule.days, d].sort(),
    });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim()) return setError('Class name is required.');
    let teacherId = draft.teacherId;
    if (teacherId === '__new' && newTeacher.trim()) {
      teacherId = useTeacherStore.getState().addTeacher({
        name: newTeacher.trim(),
        subjects: [draft.name.trim()],
        email: '',
        officeHours: [],
        preferredContact: 'email',
        bio: '',
      }).id;
    } else if (teacherId === '__new') teacherId = null;
    const data = {
      ...draft,
      teacherId,
      name: draft.name.trim(),
      subject: draft.subject.trim() || draft.name.trim(),
    };
    const store = useClassStore.getState();
    if (initial) store.updateClass(initial.id, data);
    else store.addClass(data);
    pushToast({
      variant: 'success',
      title: initial ? 'Class updated' : 'Class added',
      description: data.name,
    });
    onDone();
  };

  return (
    <form id="class-form" onSubmit={submit} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Class name">
          {(id) => (
            <Input
              id={id}
              data-autofocus
              value={draft.name}
              onChange={(e) => {
                set('name', e.target.value);
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
              onChange={(e) => set('subject', e.target.value)}
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
        <Field label="Teacher">
          {(id) => (
            <Select
              id={id}
              value={draft.teacherId ?? ''}
              onChange={(e) => set('teacherId', e.target.value || null)}
            >
              <option value="">No teacher</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
              <option value="__new">+ Add a new teacher…</option>
            </Select>
          )}
        </Field>
        {draft.teacherId === '__new' ? (
          <Field label="New teacher name">
            {(id) => (
              <Input
                id={id}
                value={newTeacher}
                onChange={(e) => setNewTeacher(e.target.value)}
                placeholder="Ms. Rivera"
              />
            )}
          </Field>
        ) : (
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
        )}
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
      <ColorPicker value={draft.color} onChange={(c) => set('color', c)} />
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
      title={classItem ? 'Edit class' : 'Add a class'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="class-form">
            {classItem ? 'Save' : 'Add class'}
          </Button>
        </>
      }
    >
      {open && <ClassForm key={classItem?.id ?? 'new'} initial={classItem} onDone={onClose} />}
    </Modal>
  );
}
