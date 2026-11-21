import { useState } from 'react';
import { ArrowDown, ArrowUp, LogOut, Pencil, Plus, Trash2 } from 'lucide-react';
import type { ClassItem } from '@/types';
import { useClassStore } from '@/stores/classStore';
import { useTaskStore } from '@/stores/taskStore';
import { useTeacherStore } from '@/stores/teacherStore';
import { useProfile } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { subjectVars } from '@/utils/colors';
import { Button, IconButton } from '@/components/ui/Button';
import { ClassFormModal } from '@/features/classes/ClassFormModal';
import { JoinClassModal } from '@/features/classes/JoinClassForm';
import { SettingsSection } from './SettingsSection';

export function ClassManager() {
  const me = useProfile();
  const teacher = me.role === 'teacher';
  const classes = useClassStore((s) => s.classes);
  const rosters = useClassStore((s) => s.rosters);
  const people = useTeacherStore((s) => s.teachers);
  const { moveClass, deleteClass, leaveClass } = useClassStore.getState();
  const pushToast = useUIStore((s) => s.pushToast);
  const [editing, setEditing] = useState<ClassItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  const remove = (c: ClassItem) => {
    const msg = teacher
      ? `Delete "${c.name}" for everyone? Students lose access to its class notes.`
      : `Leave "${c.name}"? Your tasks for it stay as personal tasks.`;
    if (!window.confirm(msg)) return;
    useTaskStore.getState().detachClass(c.id);
    if (teacher) deleteClass(c.id);
    else leaveClass(c.id, me.id);
    pushToast({ title: teacher ? 'Class deleted' : 'Left class', description: c.name });
  };

  return (
    <SettingsSection
      id="classes"
      title="Classes"
      description={
        teacher
          ? 'Create, edit or reorder your classes.'
          : 'Join or leave classes, and choose the order they appear in.'
      }
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
                {teacher ? (
                  <>
                    Code <span className="font-mono font-semibold text-fg">{c.joinCode}</span> ·{' '}
                    {rosters[c.id]?.length ?? 0} students
                  </>
                ) : (
                  <>
                    {people.find((t) => t.id === c.teacherId)?.name ?? 'Teacher'} ·{' '}
                    {c.room || 'No room'}
                  </>
                )}
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
              {teacher && (
                <IconButton
                  size="sm"
                  label={`Edit ${c.name}`}
                  onClick={() => {
                    setEditing(c);
                    setFormOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </IconButton>
              )}
              <IconButton
                size="sm"
                label={teacher ? `Delete ${c.name}` : `Leave ${c.name}`}
                onClick={() => remove(c)}
                className="hover:text-danger-text"
              >
                {teacher ? <Trash2 className="h-4 w-4" /> : <LogOut className="h-4 w-4" />}
              </IconButton>
            </div>
          </li>
        ))}
      </ul>
      {teacher ? (
        <Button
          variant="secondary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          Create class
        </Button>
      ) : (
        <Button
          variant="secondary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setJoinOpen(true)}
        >
          Join a class
        </Button>
      )}
      <ClassFormModal open={formOpen} onClose={() => setFormOpen(false)} classItem={editing} />
      <JoinClassModal open={joinOpen} onClose={() => setJoinOpen(false)} />
    </SettingsSection>
  );
}
