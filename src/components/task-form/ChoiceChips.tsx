import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface ChoiceChipsProps<T extends string> {
  legend: string;
  options: { id: T; label: string; icon?: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  name: string;
}

/** Radio group rendered as pill chips. */
export function ChoiceChips<T extends string>({
  legend,
  options,
  value,
  onChange,
  name,
}: ChoiceChipsProps<T>) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-semibold">{legend}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const checked = o.id === value;
          return (
            <label
              key={o.id}
              className={cn(
                'inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-sm font-semibold transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent',
                checked
                  ? 'border-accent bg-accent-soft text-accent-text'
                  : 'border-border text-muted hover:border-border-strong hover:text-fg',
              )}
            >
              <input
                type="radio"
                name={name}
                value={o.id}
                checked={checked}
                onChange={() => onChange(o.id)}
                className="sr-only"
              />
              {o.icon}
              {o.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
