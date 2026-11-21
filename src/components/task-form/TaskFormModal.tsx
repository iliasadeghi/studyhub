import { useState, type FormEvent } from 'react';
import { Trash2 } from 'lucide-react';
import type { Importance, Task, TaskStatus, TaskType } from '@/types';
import { useUIStore } from '@/stores/uiStore';
import { makeTask, useTaskStore } from '@/stores/taskStore';
import { useClassStore } from '@/stores/classStore';
import { combineDateTime, toDateInput, toTimeInput } from '@/utils/dates';
import { computePriority } from '@/utils/priority';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { TASK_TYPES, STATUS_META, STATUS_ORDER, PRIORITY_META } from '@/features/tasks/taskMeta';
import { useTaskActions } from '@/features/tasks/useTaskActions';
import { ChoiceChips } from './ChoiceChips';
import { LinkEditor, SubtaskEditor } from './ListEditors';

const ESTIMATES = [10, 15, 20, 30, 45, 60, 90, 120, 180, 240];

function TaskForm({
  initial,
  isEdit,
  onDone,
}: {
  initial: Task;
  isEdit: boolean;
  onDone: () => void;
}) {
  const classes = useClassStore((s) => s.classes);
  const pushToast = useUIStore((s) => s.pushToast);
  const { remove } = useTaskActions();
  const [draft, setDraft] = useState<Task>(initial);
  const [date, setDate] = useState(toDateInput(initial.dueAt));
  const [time, setTime] = useState(toTimeInput(initial.dueAt));
  const [error, setError] = useState('');
  const set = <K extends keyof Task>(key: K, value: Task[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const dueAt = date && time ? combineDateTime(date, time) : draft.dueAt;
  const preview = computePriority({ ...draft, dueAt });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.title.trim()) {
      setError('Give your task a title.');
      return;
    }
    const final: Task = {
      ...draft,
      title: draft.title.trim(),
      dueAt,
      completedAt: draft.status === 'done' ? (draft.completedAt ?? new Date().toISOString()) : null,
    };
    const store = useTaskStore.getState();
    if (isEdit) {
      store.updateTask(final.id, final);
      pushToast({ variant: 'success', title: 'Task updated' });
    } else {
      store.restoreTask(final);
      pushToast({ variant: 'success', title: 'Task added', description: final.title });
    }
    onDone();
  };

  return (
    <form id="task-form" onSubmit={submit} className="space-y-5" noValidate>
      <Field label="Title">
        {(id) => (
          <Input
            id={id}
            data-autofocus
            value={draft.title}
            onChange={(e) => {
              set('title', e.target.value);
              setError('');
            }}
            placeholder="e.g. Chemistry worksheet 4.2"
            aria-invalid={!!error}
            aria-describedby={error ? 'task-title-error' : undefined}
            className="h-11 text-base"
          />
        )}
      </Field>
      {error && (
        <p
          id="task-title-error"
          role="alert"
          className="-mt-3 text-sm font-medium text-danger-text"
        >
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Class">
          {(id) => (
            <Select
              id={id}
              value={draft.classId ?? ''}
              onChange={(e) => set('classId', e.target.value || null)}
            >
              <option value="">No class (personal)</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Status">
          {(id) => (
            <Select
              id={id}
              value={draft.status}
              onChange={(e) => set('status', e.target.value as TaskStatus)}
            >
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {STATUS_META[s].label}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>

      <ChoiceChips<TaskType>
        legend="Type"
        name="task-type"
        value={draft.type}
        onChange={(v) => set('type', v)}
        options={TASK_TYPES.map((t) => ({
          id: t.id,
          label: t.label,
          icon: <t.icon className="h-3.5 w-3.5" aria-hidden />,
        }))}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Field label="Due date">
          {(id) => (
            <Input id={id} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          )}
        </Field>
        <Field label="Due time">
          {(id) => (
            <Input id={id} type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          )}
        </Field>
        <Field label="Estimated time" className="col-span-2 sm:col-span-1">
          {(id) => (
            <Select
              id={id}
              value={draft.estimatedMinutes}
              onChange={(e) => set('estimatedMinutes', Number(e.target.value))}
            >
              {Array.from(new Set([...ESTIMATES, draft.estimatedMinutes]))
                .sort((a, b) => a - b)
                .map((m) => (
                  <option key={m} value={m}>
                    {m < 60 ? `${m} min` : `${m / 60} hr${m > 60 ? 's' : ''}`}
                  </option>
                ))}
            </Select>
          )}
        </Field>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <ChoiceChips<Importance>
          legend="Importance"
          name="importance"
          value={draft.importance}
          onChange={(v) => set('importance', v)}
          options={[
            { id: 'low', label: 'Low' },
            { id: 'medium', label: 'Medium' },
            { id: 'high', label: 'High' },
          ]}
        />
        {draft.status !== 'done' && (
          <p className="text-sm text-muted" aria-live="polite">
            Priority:{' '}
            <span className="font-bold text-fg">{PRIORITY_META[preview.level].label}</span> (
            {preview.score}/100)
          </p>
        )}
      </div>

      <Field label="Description">
        {(id) => (
          <Textarea
            id={id}
            value={draft.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Details, instructions, page numbers…"
            rows={3}
          />
        )}
      </Field>

      <SubtaskEditor value={draft.subtasks} onChange={(v) => set('subtasks', v)} />
      <LinkEditor value={draft.links} onChange={(v) => set('links', v)} />

      {isEdit && (
        <div className="border-t border-border pt-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-danger-text hover:bg-danger-soft hover:text-danger-text"
            leftIcon={<Trash2 className="h-4 w-4" />}
            onClick={() => {
              remove(initial);
              onDone();
            }}
          >
            Delete task
          </Button>
        </div>
      )}
    </form>
  );
}

/** Global create/edit task dialog driven by the UI store. */
export function TaskFormModal() {
  const { open, task, defaults } = useUIStore((s) => s.taskForm);
  const close = useUIStore((s) => s.closeTaskForm);
  const [initial, setInitial] = useState<Task | null>(null);
  const [lastOpen, setLastOpen] = useState(false);

  // Build the initial draft once per opening (derived state pattern).
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) setInitial(task ?? makeTask({ title: '', ...defaults }));
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={task ? 'Edit task' : 'New task'}
      description={task ? undefined : 'Add homework, a test, or anything on your plate.'}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" form="task-form">
            {task ? 'Save changes' : 'Add task'}
          </Button>
        </>
      }
    >
      {initial && <TaskForm key={initial.id} initial={initial} isEdit={!!task} onDone={close} />}
    </Modal>
  );
}
