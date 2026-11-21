import { useDroppable } from '@dnd-kit/core';
import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { cn } from '@/utils/cn';
import { subjectVars } from '@/utils/colors';
import { WEEKDAY_SHORT } from '@/utils/dates';
import { CalendarChip } from './CalendarChip';
import { dayKey, type CalendarItem } from './useCalendarItems';

interface Props {
  cursor: Date;
  now: Date;
  selected: Date;
  weekStartsOn: 0 | 1;
  items: Map<string, CalendarItem[]>;
  onSelect: (d: Date) => void;
  onOpenItem: (item: CalendarItem) => void;
}

function DayCell({
  day,
  inMonth,
  isToday,
  isSelected,
  items,
  onSelect,
  onOpenItem,
}: {
  day: Date;
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  items: CalendarItem[];
  onSelect: () => void;
  onOpenItem: (item: CalendarItem) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: dayKey(day) });
  const visible = items.slice(0, 3);
  const extra = items.length - visible.length;
  return (
    // Mouse convenience: clicking anywhere in the cell selects the day.
    // Keyboard users select via the day-number button inside.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div
      ref={setNodeRef}
      onClick={onSelect}
      className={cn(
        'group flex min-h-16 cursor-pointer flex-col gap-1 border-r border-b border-border p-1 transition-colors sm:min-h-28 sm:p-1.5',
        !inMonth && 'bg-surface-2/50',
        isSelected && 'bg-accent-soft/60',
        isOver && 'bg-accent-soft ring-2 ring-accent ring-inset',
      )}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        aria-label={`${format(day, 'EEEE, MMMM d')}${items.length ? `, ${items.length} items` : ''}`}
        aria-current={isToday ? 'date' : undefined}
        aria-pressed={isSelected}
        className={cn(
          'grid h-7 w-7 place-items-center self-center rounded-full text-xs font-semibold sm:self-start',
          isToday
            ? 'bg-accent text-accent-fg'
            : inMonth
              ? 'text-fg hover:bg-surface-2'
              : 'text-subtle',
        )}
      >
        {format(day, 'd')}
      </button>
      {/* Phones: dots only */}
      {items.length > 0 && (
        <div className="flex flex-wrap justify-center gap-0.5 sm:hidden" aria-hidden>
          {items.slice(0, 4).map((it) => (
            <span
              key={it.id}
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: it.color ? subjectVars(it.color).solid : 'var(--text-subtle)' }}
            />
          ))}
        </div>
      )}
      <div className="hidden min-w-0 flex-col gap-0.5 sm:flex">
        {visible.map((it) => (
          <CalendarChip key={it.id} item={it} onClick={() => onOpenItem(it)} />
        ))}
        {extra > 0 && (
          <span className="px-1.5 text-[11px] font-semibold text-muted">+{extra} more</span>
        )}
      </div>
    </div>
  );
}

export function MonthView({
  cursor,
  now,
  selected,
  weekStartsOn,
  items,
  onSelect,
  onOpenItem,
}: Props) {
  const start = startOfWeek(startOfMonth(cursor), { weekStartsOn });
  const end = endOfWeek(endOfMonth(cursor), { weekStartsOn });
  const days: Date[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) days.push(d);
  const headers = Array.from({ length: 7 }, (_, i) => WEEKDAY_SHORT[(i + weekStartsOn) % 7]);

  return (
    <div
      aria-label={format(cursor, 'MMMM yyyy')}
      role="group"
      className="overflow-hidden rounded-lg border-t border-l border-border bg-surface shadow-soft"
    >
      <div aria-hidden className="grid grid-cols-7">
        {headers.map((h) => (
          <div
            key={h}
            className="border-r border-b border-border bg-surface-2 py-2 text-center text-xs font-bold text-muted"
          >
            {h}
          </div>
        ))}
      </div>
      {Array.from({ length: days.length / 7 }, (_, w) => (
        <div key={w} className="grid grid-cols-7">
          {days.slice(w * 7, w * 7 + 7).map((d) => (
            <DayCell
              key={d.toISOString()}
              day={d}
              inMonth={isSameMonth(d, cursor)}
              isToday={isSameDay(d, now)}
              isSelected={isSameDay(d, selected)}
              items={items.get(dayKey(d)) ?? []}
              onSelect={() => onSelect(d)}
              onOpenItem={onOpenItem}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
