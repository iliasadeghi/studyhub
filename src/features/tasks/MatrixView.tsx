import { useState } from 'react';
import { DndContext, DragOverlay, type DragEndEvent } from '@dnd-kit/core';
import { RotateCcw } from 'lucide-react';
import type { ClassItem, Quadrant, Task } from '@/types';
import { quadrantFor } from '@/utils/priority';
import { useTaskStore } from '@/stores/taskStore';
import { Button } from '@/components/ui/Button';
import { TaskCard } from './TaskCard';
import { Draggable, Droppable } from './dnd';
import { makeAnnouncements, useDndSensors } from './dndUtils';
import { QUADRANT_META, QUADRANT_ORDER } from './taskMeta';

interface Props {
  tasks: Task[];
  classMap: Record<string, ClassItem>;
  now: Date;
}

export function MatrixView({ tasks, classMap, now }: Props) {
  const sensors = useDndSensors();
  const updateTask = useTaskStore((s) => s.updateTask);
  const [activeId, setActiveId] = useState<string | null>(null);
  const open = tasks.filter((t) => t.status !== 'done');
  const active = open.find((t) => t.id === activeId);
  const overrides = open.filter((t) => t.quadrantOverride);
  const byId = (id: string | number) => open.find((t) => t.id === id)?.title ?? 'task';

  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const q = e.over?.id as Quadrant | undefined;
    const task = open.find((t) => t.id === e.active.id);
    if (!task || !q || !QUADRANT_ORDER.includes(q)) return;
    const auto = quadrantFor({ ...task, quadrantOverride: null }, now);
    updateTask(task.id, { quadrantOverride: q === auto ? null : q });
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(e) => setActiveId(String(e.active.id))}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
      accessibility={{
        announcements: makeAnnouncements(byId, (id) =>
          id ? (QUADRANT_META[id as Quadrant]?.title ?? '') : '',
        ),
      }}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
        <p>
          Tasks are placed automatically by urgency (due within 48h) and importance. Drag to
          override.
        </p>
        {overrides.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<RotateCcw className="h-4 w-4" />}
            onClick={() => overrides.forEach((t) => updateTask(t.id, { quadrantOverride: null }))}
          >
            Reset {overrides.length} manual placement{overrides.length > 1 ? 's' : ''}
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {QUADRANT_ORDER.map((q) => {
          const meta = QUADRANT_META[q];
          const items = open.filter((t) => quadrantFor(t, now) === q);
          return (
            <Droppable
              key={q}
              id={q}
              label={`${meta.title} quadrant`}
              className="flex min-h-56 flex-col rounded-lg border border-border bg-surface-2/60 p-3"
            >
              <header className="mb-3 flex items-start gap-2.5 px-1">
                <span
                  aria-hidden
                  className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: meta.tone }}
                />
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-bold">
                    {meta.title} <span className="font-medium text-muted">· {meta.subtitle}</span>
                  </h2>
                  <p className="text-xs text-muted">{meta.hint}</p>
                </div>
                <span className="rounded-full bg-surface px-2 text-xs font-semibold text-muted">
                  {items.length}
                </span>
              </header>
              <ul className="flex flex-1 flex-col gap-2">
                {items.map((t) => (
                  <li key={t.id}>
                    <Draggable id={t.id}>
                      <TaskCard
                        task={t}
                        classItem={t.classId ? classMap[t.classId] : undefined}
                        now={now}
                      />
                    </Draggable>
                  </li>
                ))}
                {items.length === 0 && (
                  <li className="grid flex-1 place-items-center rounded-md border-2 border-dashed border-border p-6 text-center text-sm text-muted">
                    Nothing here
                  </li>
                )}
              </ul>
            </Droppable>
          );
        })}
      </div>
      <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }}>
        {active ? (
          <TaskCard
            task={active}
            classItem={active.classId ? classMap[active.classId] : undefined}
            now={now}
            dragging
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
