import { useState } from 'react';
import { DndContext, DragOverlay, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import type { ClassItem, Task, TaskStatus } from '@/types';
import { cn } from '@/utils/cn';
import { TaskCard } from './TaskCard';
import { Draggable, Droppable } from './dnd';
import { makeAnnouncements, useDndSensors } from './dndUtils';
import { STATUS_META, STATUS_ORDER } from './taskMeta';
import { useTaskActions } from './useTaskActions';

interface Props {
  tasks: Task[];
  classMap: Record<string, ClassItem>;
  now: Date;
}

const DOT: Record<TaskStatus, string> = {
  todo: 'bg-subtle',
  in_progress: 'bg-info',
  done: 'bg-success',
};

export function BoardView({ tasks, classMap, now }: Props) {
  const sensors = useDndSensors();
  const { setStatus } = useTaskActions();
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = tasks.find((t) => t.id === activeId);
  const byId = (id: string | number) => tasks.find((t) => t.id === id)?.title ?? 'task';

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const task = tasks.find((t) => t.id === e.active.id);
    const status = e.over?.id as TaskStatus | undefined;
    if (task && status && STATUS_ORDER.includes(status)) setStatus(task, status);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
      accessibility={{
        announcements: makeAnnouncements(byId, (id) =>
          id ? (STATUS_META[id as TaskStatus]?.label ?? '') : '',
        ),
      }}
    >
      <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0 md:grid md:grid-cols-3 md:overflow-visible">
        {STATUS_ORDER.map((status) => {
          const col = tasks.filter((t) => t.status === status);
          return (
            <Droppable
              key={status}
              id={status}
              label={`${STATUS_META[status].label} column`}
              className="flex w-[82vw] max-w-sm shrink-0 snap-start flex-col rounded-lg border border-border bg-surface-2/60 p-3 md:w-auto md:max-w-none"
            >
              <header className="mb-3 flex items-center gap-2 px-1">
                <span aria-hidden className={cn('h-2 w-2 rounded-full', DOT[status])} />
                <h2 className="text-sm font-bold">{STATUS_META[status].label}</h2>
                <span className="ml-auto rounded-full bg-surface px-2 text-xs font-semibold text-muted">
                  {col.length}
                </span>
              </header>
              <ul className="flex min-h-32 flex-1 flex-col gap-2">
                {col.map((t) => (
                  <li key={t.id}>
                    <Draggable id={t.id}>
                      <TaskCard
                        task={t}
                        classItem={t.classId ? classMap[t.classId] : undefined}
                        variant="card"
                        now={now}
                      />
                    </Draggable>
                  </li>
                ))}
                {col.length === 0 && (
                  <li className="grid flex-1 place-items-center rounded-md border-2 border-dashed border-border p-6 text-center text-sm text-muted">
                    Drop tasks here
                  </li>
                )}
              </ul>
            </Droppable>
          );
        })}
      </div>
      <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }}>
        {active ? (
          <div className="rotate-2">
            <TaskCard
              task={active}
              classItem={active.classId ? classMap[active.classId] : undefined}
              variant="card"
              now={now}
              dragging
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
