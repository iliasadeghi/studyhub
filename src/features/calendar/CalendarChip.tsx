import { useDraggable } from '@dnd-kit/core';
import { format } from 'date-fns';
import { Check, Sparkles } from 'lucide-react';
import { cn } from '@/utils/cn';
import { subjectVars } from '@/utils/colors';
import { isBookingEvent, type CalendarItem } from './useCalendarItems';

function chipStyle(item: CalendarItem) {
  const v = item.color ? subjectVars(item.color) : null;
  if (item.kind === 'study') {
    return { borderColor: v?.solid ?? 'var(--accent)', color: v?.text ?? 'var(--accent-text)' };
  }
  return v
    ? { background: v.soft, color: v.text }
    : { background: 'var(--surface-2)', color: 'var(--text-muted)' };
}

export function ChipContent({ item, showTime }: { item: CalendarItem; showTime?: boolean }) {
  const done = item.kind === 'task' && item.task.status === 'done';
  return (
    <span className="flex min-w-0 items-center gap-1">
      {item.kind === 'study' && <Sparkles className="h-3 w-3 shrink-0" aria-hidden />}
      {done && <Check className="h-3 w-3 shrink-0" aria-hidden />}
      {showTime && item.kind !== 'study' && (
        <span className="shrink-0 tabular-nums opacity-75">
          {format(item.date, 'h:mma').toLowerCase()}
        </span>
      )}
      <span className={cn('truncate', done && 'line-through opacity-70')}>{item.title}</span>
    </span>
  );
}

/** A colored chip for the calendar. Tasks and events can be dragged to another day. */
export function CalendarChip({
  item,
  showTime,
  onClick,
}: {
  item: CalendarItem;
  showTime?: boolean;
  onClick?: () => void;
}) {
  const draggable = item.kind === 'task' || (item.kind === 'event' && !isBookingEvent(item.id));
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${item.kind}:${item.id}`,
    disabled: !draggable,
  });
  const label =
    item.kind === 'study'
      ? `Suggested study block: ${item.title}`
      : `${item.kind === 'event' ? 'Event' : 'Task'}: ${item.title}, ${format(item.date, 'h:mm a')}`;

  return (
    <button
      ref={setNodeRef}
      type="button"
      {...(draggable ? attributes : {})}
      {...(draggable ? listeners : {})}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      aria-label={label}
      className={cn(
        'block w-full touch-manipulation rounded-[6px] px-1.5 py-0.5 text-left text-[11px] leading-4 font-semibold transition-opacity',
        item.kind === 'study' && 'border border-dashed bg-transparent',
        item.kind === 'event' && 'ring-1 ring-current/20 ring-inset',
        isDragging && 'opacity-40',
      )}
      style={chipStyle(item)}
    >
      <ChipContent item={item} showTime={showTime} />
    </button>
  );
}
