import { useState } from 'react';
import { Link2, Plus, X } from 'lucide-react';
import type { Subtask, TaskLink } from '@/types';
import { uid } from '@/utils/id';
import { Input } from '@/components/ui/Field';
import { IconButton } from '@/components/ui/Button';

export function SubtaskEditor({
  value,
  onChange,
}: {
  value: Subtask[];
  onChange: (v: Subtask[]) => void;
}) {
  const [draft, setDraft] = useState('');
  const add = () => {
    if (!draft.trim()) return;
    onChange([...value, { id: uid('st'), title: draft.trim(), done: false }]);
    setDraft('');
  };
  return (
    <fieldset className="space-y-2">
      <legend className="mb-1.5 text-sm font-semibold">Subtasks</legend>
      {value.length > 0 && (
        <ul className="space-y-1.5">
          {value.map((st) => (
            <li
              key={st.id}
              className="flex items-center gap-2 rounded-sm bg-surface-2 py-1 pr-1 pl-3"
            >
              <input
                type="checkbox"
                checked={st.done}
                onChange={() =>
                  onChange(value.map((s) => (s.id === st.id ? { ...s, done: !s.done } : s)))
                }
                aria-label={`Mark "${st.title}" ${st.done ? 'not done' : 'done'}`}
                className="h-4 w-4 accent-[var(--accent)]"
              />
              <input
                value={st.title}
                onChange={(e) =>
                  onChange(value.map((s) => (s.id === st.id ? { ...s, title: e.target.value } : s)))
                }
                aria-label="Subtask title"
                className={`min-w-0 flex-1 bg-transparent text-sm focus:outline-none ${st.done ? 'text-muted line-through' : ''}`}
              />
              <IconButton
                size="sm"
                label={`Remove "${st.title}"`}
                onClick={() => onChange(value.filter((s) => s.id !== st.id))}
              >
                <X className="h-4 w-4" />
              </IconButton>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Add a step and press Enter"
          aria-label="New subtask"
        />
        <IconButton variant="secondary" label="Add subtask" onClick={add}>
          <Plus className="h-4 w-4" />
        </IconButton>
      </div>
    </fieldset>
  );
}

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function LinkEditor({
  value,
  onChange,
}: {
  value: TaskLink[];
  onChange: (v: TaskLink[]) => void;
}) {
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const add = () => {
    const href = normalizeUrl(url);
    if (!href) return;
    onChange([
      ...value,
      { id: uid('ln'), label: label.trim() || href.replace(/^https?:\/\//, ''), url: href },
    ]);
    setLabel('');
    setUrl('');
  };
  return (
    <fieldset className="space-y-2">
      <legend className="mb-1.5 text-sm font-semibold">Attachments (links)</legend>
      {value.length > 0 && (
        <ul className="space-y-1.5">
          {value.map((l) => (
            <li
              key={l.id}
              className="flex items-center gap-2 rounded-sm bg-surface-2 py-1 pr-1 pl-3 text-sm"
            >
              <Link2 className="h-4 w-4 shrink-0 text-muted" aria-hidden />
              <a
                href={l.url}
                target="_blank"
                rel="noreferrer"
                className="min-w-0 flex-1 truncate font-medium text-accent-text hover:underline"
              >
                {l.label}
              </a>
              <IconButton
                size="sm"
                label={`Remove link "${l.label}"`}
                onClick={() => onChange(value.filter((x) => x.id !== l.id))}
              >
                <X className="h-4 w-4" />
              </IconButton>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label (optional)"
          aria-label="Link label"
          className="sm:w-40"
        />
        <div className="flex flex-1 gap-2">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                add();
              }
            }}
            placeholder="https://…"
            aria-label="Link URL"
            inputMode="url"
          />
          <IconButton variant="secondary" label="Add link" onClick={add}>
            <Plus className="h-4 w-4" />
          </IconButton>
        </div>
      </div>
    </fieldset>
  );
}
