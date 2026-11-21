import { Plus, X } from 'lucide-react';
import type { SubjectColor } from '@/types';
import { SUBJECT_COLORS, SUBJECT_COLOR_LABELS, subjectVars } from '@/utils/colors';
import { Input, Select } from '@/components/ui/Field';
import { Button, IconButton } from '@/components/ui/Button';
import { newDraft, type DraftClass } from './draft';

const SUGGESTIONS: [string, SubjectColor][] = [
  ['Algebra', 'blue'],
  ['Biology', 'green'],
  ['English', 'purple'],
  ['History', 'amber'],
  ['Spanish', 'rose'],
  ['Art', 'pink'],
  ['Computer Science', 'cyan'],
  ['PE', 'lime'],
];

export function ClassesStep({
  value,
  onChange,
}: {
  value: DraftClass[];
  onChange: (v: DraftClass[]) => void;
}) {
  const update = (key: string, patch: Partial<DraftClass>) =>
    onChange(value.map((c) => (c.key === key ? { ...c, ...patch } : c)));
  const used = new Set(value.map((c) => c.name.toLowerCase()));

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-bold tracking-wide text-muted uppercase">Quick add</p>
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS.filter(([n]) => !used.has(n.toLowerCase())).map(([name, color]) => (
            <button
              key={name}
              type="button"
              onClick={() =>
                onChange([...value.filter((c) => c.name.trim()), newDraft(name, color)])
              }
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border px-3 text-sm font-semibold hover:border-border-strong"
            >
              <span
                aria-hidden
                className="h-2 w-2 rounded-full"
                style={{ background: subjectVars(color).solid }}
              />
              {name}
            </button>
          ))}
        </div>
      </div>
      <ul className="space-y-2">
        {value.map((c, i) => (
          <li
            key={c.key}
            className="grid grid-cols-[auto_1fr_auto] items-start gap-2 rounded-md border border-border bg-surface-2/50 p-2.5 sm:grid-cols-[auto_1.3fr_1fr_0.7fr_auto] sm:items-center"
          >
            <label className="relative">
              <span className="sr-only">Color for class {i + 1}</span>
              <Select
                value={c.color}
                onChange={(e) => update(c.key, { color: e.target.value as SubjectColor })}
                className="w-11 pr-0 pl-0 text-transparent"
                style={{ background: subjectVars(c.color).solid }}
              >
                {SUBJECT_COLORS.map((col) => (
                  <option key={col} value={col} className="text-fg">
                    {SUBJECT_COLOR_LABELS[col]}
                  </option>
                ))}
              </Select>
            </label>
            <Input
              value={c.name}
              onChange={(e) => update(c.key, { name: e.target.value })}
              placeholder="Class name"
              aria-label={`Class ${i + 1} name`}
            />
            <IconButton
              label={`Remove class ${i + 1}`}
              onClick={() => onChange(value.filter((x) => x.key !== c.key))}
              className="sm:order-last"
            >
              <X className="h-4 w-4" />
            </IconButton>
            <Input
              value={c.teacher}
              onChange={(e) => update(c.key, { teacher: e.target.value })}
              placeholder="Teacher (e.g. Ms. Lee)"
              aria-label={`Class ${i + 1} teacher`}
              className="col-span-3 sm:col-span-1"
            />
            <Input
              value={c.room}
              onChange={(e) => update(c.key, { room: e.target.value })}
              placeholder="Room"
              aria-label={`Class ${i + 1} room`}
              className="col-span-3 sm:col-span-1"
            />
          </li>
        ))}
      </ul>
      <Button
        variant="ghost"
        size="sm"
        leftIcon={<Plus className="h-4 w-4" />}
        onClick={() =>
          onChange([...value, newDraft('', SUBJECT_COLORS[value.length % SUBJECT_COLORS.length])])
        }
      >
        Add another class
      </Button>
    </div>
  );
}
