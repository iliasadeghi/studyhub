import { useDroppable } from '@dnd-kit/core';
import { addDays, format, isSameDay, startOfWeek } from 'date-fns';
import { cn } from '@/utils/cn';
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

function DayColumn({
  day,
  isToday,
  isSelected,
  items,
  onSelect,
  onOpenItem,
}: {
  day: Date;
  isToday: boolean;
  isSelected: boolean;
  items: CalendarItem[];
  onSelect: () => void;
  onOpenItem: (item: CalendarItem) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: dayKey(day) });
  return (
    <section
      ref={setNodeRef}
      aria-label={format(day, 'EEEE, MMMM d')}
      className={cn(
        'flex min-h-24 flex-col rounded-lg border border-border bg-surface p-2 shadow-soft transition-colors md:min-h-[420px]',
        isSelected && 'border-accent',
        isOver && 'bg-accent-soft ring-2 ring-accent',
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-current={isToday ? 'date' : undefined}
        className="mb-2 flex items-center gap-2 rounded-md p-1 text-left hover:bg-surface-2 md:flex-col md:items-start md:gap-0"
      >
        <span className="text-xs font-bold text-muted uppercase">{format(day, 'EEE')}</span>
        <span
          className={cn(
            'grid h-8 w-8 place-items-center rounded-full text-base font-extrabold',
            isToday && 'bg-accent text-accent-fg',
          )}
        >
          {format(day, 'd')}
        </span>
      </button>
      <div className="flex flex-col gap-1">
        {items.map((it) => (
          <CalendarChip key={it.id} item={it} showTime onClick={() => onOpenItem(it)} />
        ))}
        {items.length === 0 && <p className="px-1 text-xs text-subtle md:hidden">Free day</p>}
      </div>
    </section>
  );
}

export function WeekView({
  cursor,
  now,
  selected,
  weekStartsOn,
  items,
  onSelect,
  onOpenItem,
}: Props) {
  const start = startOfWeek(cursor, { weekStartsOn });
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-7">
      {days.map((d) => (
        <DayColumn
          key={d.toISOString()}
          day={d}
          isToday={isSameDay(d, now)}
          isSelected={isSameDay(d, selected)}
          items={items.get(dayKey(d)) ?? []}
          onSelect={() => onSelect(d)}
          onOpenItem={onOpenItem}
        />
      ))}
    </div>
  );
}
