import { useState } from 'react';
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react';
import type { ClassItem } from '@/types';
import { useClassStore } from '@/stores/classStore';
import { useTaskStore } from '@/stores/taskStore';
import { useTeacherStore } from '@/stores/teacherStore';
import { useUIStore } from '@/stores/uiStore';
import { subjectVars } from '@/utils/colors';
import { Button, IconButton } from '@/components/ui/Button';
import { ClassFormModal } from '@/features/classes/ClassFormModal';
import { SettingsSection } from './SettingsSection';

export function ClassManager() {
  const classes = useClassStore((s) => s.classes);
  const teachers = useTeacherStore((s) => s.teachers);
  const { moveClass, deleteClass } = useClassStore.getState();
  const pushToast = useUIStore((s) => s.pushToast);
  const [editing, setEditing] = useState<ClassItem | null>(null);
  const [open, setOpen] = useState(false);

  const remove = (c: ClassItem) => {
    if (!window.confirm(`Delete "${c.name}"? Its tasks will be kept as personal tasks.`)) return;
    useTaskStore.getState().detachClass(c.id);
    deleteClass(c.id);
    pushToast({ title: 'Class deleted', description: c.name });
  };

  return (
    <SettingsSection
      id="classes"
      title="Classes"
      description="Add, edit, or reorder your classes. Order is used across the app."
    >
      <ul className="divide-y divide-border rounded-md border border-border">
        {classes.length === 0 && (
          <li className="p-4 text-center text-sm text-muted">No classes yet.</li>
        )}
        {classes.map((c, i) => (
          <li key={c.id} className="flex items-center gap-3 px-3 py-2.5">
            <span
              aria-hidden
              className="h-8 w-1.5 shrink-0 rounded-full"
              style={{ background: subjectVars(c.color).solid }}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{c.name}</p>
              <p className="truncate text-xs text-muted">
                {teachers.find((t) => t.id === c.teacherId)?.name ?? 'No teacher'} ·{' '}
                {c.room || 'No room'}
              </p>
            </div>
            <div className="flex shrink-0 items-center">
              <IconButton
                size="sm"
                label={`Move ${c.name} up`}
                disabled={i === 0}
                onClick={() => moveClass(c.id, -1)}
                className="disabled:opacity-30"
              >
                <ArrowUp className="h-4 w-4" />
              </IconButton>
              <IconButton
                size="sm"
                label={`Move ${c.name} down`}
                disabled={i === classes.length - 1}
                onClick={() => moveClass(c.id, 1)}
                className="disabled:opacity-30"
              >
                <ArrowDown className="h-4 w-4" />
              </IconButton>
              <IconButton
                size="sm"
                label={`Edit ${c.name}`}
                onClick={() => {
                  setEditing(c);
                  setOpen(true);
                }}
              >
                <Pencil className="h-4 w-4" />
              </IconButton>
              <IconButton
                size="sm"
                label={`Delete ${c.name}`}
                onClick={() => remove(c)}
                className="hover:text-danger-text"
              >
                <Trash2 className="h-4 w-4" />
              </IconButton>
            </div>
          </li>
        ))}
      </ul>
      <Button
        variant="secondary"
        leftIcon={<Plus className="h-4 w-4" />}
        onClick={() => {
          setEditing(null);
          setOpen(true);
        }}
      >
        Add class
      </Button>
      <ClassFormModal open={open} onClose={() => setOpen(false)} classItem={editing} />
    </SettingsSection>
  );
}
