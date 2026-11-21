import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Eye, PenLine } from 'lucide-react';
import type { ClassItem, Note } from '@/types';
import { useNoteStore } from '@/stores/noteStore';
import { useProfile } from '@/stores/authStore';
import { Toggle } from '@/features/settings/SettingsSection';
import { useDebounce } from '@/hooks/useDebounce';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { Tabs } from '@/components/ui/Tabs';
import { cn } from '@/utils/cn';
import { Markdown } from './Markdown';

type Pane = 'write' | 'preview';

/** Markdown editor with live preview; autosaves after a short pause. */
export function NoteEditor({ note, classes }: { note: Note; classes: ClassItem[] }) {
  const navigate = useNavigate();
  const updateNote = useNoteStore((s) => s.updateNote);
  const teacher = useProfile().role === 'teacher';
  const [draft, setDraft] = useState({
    title: note.title,
    unit: note.unit,
    classId: note.classId,
    content: note.content,
  });
  const [pane, setPane] = useState<Pane>('write');
  const debounced = useDebounce(draft, 500);
  const dirty =
    draft.title !== note.title ||
    draft.unit !== note.unit ||
    draft.classId !== note.classId ||
    draft.content !== note.content;

  useEffect(() => {
    const saved = useNoteStore.getState().notes.find((n) => n.id === note.id);
    if (!saved) return;
    const unchanged =
      saved.title === debounced.title &&
      saved.unit === debounced.unit &&
      saved.classId === debounced.classId &&
      saved.content === debounced.content;
    if (!unchanged) updateNote(note.id, debounced);
  }, [debounced, note.id, updateNote]);

  const done = () => {
    updateNote(note.id, draft);
    navigate(`/notes/${note.id}`);
  };

  return (
    <Card className="p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p
          className="flex items-center gap-1.5 text-xs font-semibold text-muted"
          aria-live="polite"
        >
          {dirty ? (
            'Saving…'
          ) : (
            <>
              <Check className="h-3.5 w-3.5 text-success" aria-hidden /> Saved
            </>
          )}
        </p>
        <Button size="sm" onClick={done} leftIcon={<Check className="h-4 w-4" />}>
          Done
        </Button>
      </div>
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-[2fr_1fr_1fr]">
        <Field label="Title">
          {(id) => (
            <Input
              id={id}
              data-autofocus
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          )}
        </Field>
        <Field label="Class">
          {(id) => (
            <Select
              id={id}
              value={draft.classId}
              onChange={(e) => setDraft({ ...draft, classId: e.target.value })}
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Unit / topic">
          {(id) => (
            <Input
              id={id}
              value={draft.unit}
              onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
              placeholder="Unit 1"
            />
          )}
        </Field>
      </div>

      {teacher && (
        <div className="mb-4 rounded-md border border-border bg-surface-2/60 p-3">
          <Toggle
            label="Share with class"
            description={
              note.visibility === 'class'
                ? 'Students in this class can read this note.'
                : 'Only you can see this note.'
            }
            checked={note.visibility === 'class'}
            onChange={(on) => updateNote(note.id, { visibility: on ? 'class' : 'private' })}
          />
        </div>
      )}

      <div className="mb-3 lg:hidden">
        <Tabs<Pane>
          label="Editor mode"
          layoutId="note-editor"
          value={pane}
          onChange={setPane}
          items={[
            { id: 'write', label: 'Write', icon: <PenLine className="h-4 w-4" aria-hidden /> },
            { id: 'preview', label: 'Preview', icon: <Eye className="h-4 w-4" aria-hidden /> },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className={cn(pane !== 'write' && 'hidden lg:block')}>
          <label htmlFor="note-content" className="mb-1.5 block text-sm font-semibold">
            Markdown
          </label>
          <Textarea
            id="note-content"
            value={draft.content}
            onChange={(e) => setDraft({ ...draft, content: e.target.value })}
            className="min-h-[55vh] resize-y font-mono text-[13px]"
            spellCheck
          />
          <p className="mt-1.5 text-xs text-muted">
            # Heading · **bold** · - list · | table | · ```code```
          </p>
        </div>
        <div className={cn(pane !== 'preview' && 'hidden lg:block')}>
          <p className="mb-1.5 text-sm font-semibold">Preview</p>
          <div className="min-h-[55vh] overflow-auto rounded-sm border border-border bg-bg p-4">
            {draft.content.trim() ? (
              <Markdown content={draft.content} />
            ) : (
              <p className="text-sm text-muted">Start typing to see a preview.</p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
