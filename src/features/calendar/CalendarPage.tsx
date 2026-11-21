import { useState } from 'react';
import { DndContext, DragOverlay, type DragEndEvent } from '@dnd-kit/core';
import {
  addMonths,
  addWeeks,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfWeek,
} from 'date-fns';
import { CalendarDays, CalendarRange, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';
import { useTaskStore } from '@/stores/taskStore';
import { useEventStore } from '@/stores/eventStore';
import { useUIStore } from '@/stores/uiStore';
import { useNow } from '@/hooks/useNow';
import { moveToDay } from '@/utils/dates';
import { cn } from '@/utils/cn';
import { Button, IconButton } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { useDndSensors } from '@/features/tasks/dndUtils';
import { MonthView } from './MonthView';
import { WeekView } from './WeekView';
import { DayPanel } from './DayPanel';
import { ChipContent } from './CalendarChip';
import { dayKey, useCalendarItems, type CalendarItem } from './useCalendarItems';

type Mode = 'month' | 'week';

export default function CalendarPage() {
  const now = useNow();
  const weekStartsOn = useSettingsStore((s) => s.weekStartsOn);
  const openTaskForm = useUIStore((s) => s.openTaskForm);
  const pushToast = useUIStore((s) => s.pushToast);
  const [mode, setMode] = useState<Mode>('month');
  const [cursor, setCursor] = useState(now);
  const [selected, setSelected] = useState(now);
  const [showPlan, setShowPlan] = useState(true);
  const [dragging, setDragging] = useState<CalendarItem | null>(null);
  const items = useCalendarItems(showPlan, now);
  const sensors = useDndSensors();

  const step = (dir: 1 | -1) =>
    setCursor((c) => (mode === 'month' ? addMonths(c, dir) : addWeeks(c, dir)));
  const goToday = () => {
    setCursor(now);
    setSelected(now);
  };

  const title =
    mode === 'month'
      ? format(cursor, 'MMMM yyyy')
      : (() => {
          const s = startOfWeek(cursor, { weekStartsOn });
          const e = endOfWeek(cursor, { weekStartsOn });
          return isSameMonth(s, e)
            ? `${format(s, 'MMM d')} – ${format(e, 'd, yyyy')}`
            : `${format(s, 'MMM d')} – ${format(e, 'MMM d, yyyy')}`;
        })();

  const findItem = (id: string): CalendarItem | undefined => {
    for (const list of items.values()) {
      const hit = list.find((i) => `${i.kind}:${i.id}` === id);
      if (hit) return hit;
    }
    return undefined;
  };

  const onDragEnd = (e: DragEndEvent) => {
    setDragging(null);
    const item = findItem(String(e.active.id));
    if (!item || !e.over) return;
    const target = parseISO(String(e.over.id));
    if (dayKey(target) === dayKey(item.date)) return;
    if (item.kind === 'task') {
      useTaskStore.getState().updateTask(item.task.id, {
        dueAt: moveToDay(item.task.dueAt, target),
        quadrantOverride: null,
      });
    } else if (item.kind === 'event') {
      const ev = item.event;
      useEventStore
        .getState()
        .updateEvent(ev.id, { start: moveToDay(ev.start, target), end: moveToDay(ev.end, target) });
    }
    setSelected(target);
    pushToast({
      variant: 'success',
      title: 'Rescheduled',
      description: `"${item.title}" moved to ${format(target, 'EEE, MMM d')}`,
    });
  };

  const openItem = (item: CalendarItem) => {
    setSelected(item.date);
    if (item.kind === 'task') openTaskForm(item.task);
  };

  const viewProps = {
    cursor,
    now,
    selected,
    weekStartsOn,
    items,
    onSelect: setSelected,
    onOpenItem: openItem,
  };

  return (
    <>
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1
            className="min-w-0 text-2xl font-extrabold tracking-tight sm:text-3xl"
            aria-live="polite"
          >
            {title}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tabs
            label="Calendar view"
            layoutId="cal-view"
            value={mode}
            onChange={setMode}
            items={[
              {
                id: 'month',
                label: 'Month',
                icon: <CalendarDays className="h-4 w-4" aria-hidden />,
              },
              {
                id: 'week',
                label: 'Week',
                icon: <CalendarRange className="h-4 w-4" aria-hidden />,
              },
            ]}
          />
          <div className="flex items-center gap-1">
            <IconButton variant="secondary" label={`Previous ${mode}`} onClick={() => step(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </IconButton>
            <Button variant="secondary" onClick={goToday}>
              Today
            </Button>
            <IconButton variant="secondary" label={`Next ${mode}`} onClick={() => step(1)}>
              <ChevronRight className="h-4 w-4" />
            </IconButton>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={showPlan}
            onClick={() => setShowPlan((v) => !v)}
            className={cn(
              'inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-semibold transition-colors',
              showPlan
                ? 'border-accent bg-accent-soft text-accent-text'
                : 'border-border text-muted hover:text-fg',
            )}
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            Study plan
          </button>
        </div>
      </header>

      <DndContext
        sensors={sensors}
        onDragStart={(e) => setDragging(findItem(String(e.active.id)) ?? null)}
        onDragEnd={onDragEnd}
        onDragCancel={() => setDragging(null)}
      >
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
          <div className="min-w-0">
            {mode === 'month' ? <MonthView {...viewProps} /> : <WeekView {...viewProps} />}
            <p className="mt-3 text-xs text-muted">
              Tip: drag a task or event to another day to reschedule it. Dashed items are suggested
              study blocks.
            </p>
          </div>
          <DayPanel day={selected} items={items.get(dayKey(selected)) ?? []} now={now} />
        </div>
        <DragOverlay>
          {dragging ? (
            <div className="rounded-[6px] bg-surface px-2 py-1 text-xs font-semibold shadow-pop ring-2 ring-accent">
              <ChipContent item={dragging} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </>
  );
}
