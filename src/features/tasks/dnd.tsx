import type { ReactNode } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { cn } from '@/utils/cn';

export function Draggable({
  id,
  children,
  data,
}: {
  id: string;
  children: ReactNode;
  data?: Record<string, unknown>;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id, data });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      aria-roledescription="Draggable task. Press space to pick up, arrow keys to move, space to drop."
      className={cn('touch-manipulation rounded-md', isDragging && 'opacity-40')}
    >
      {children}
    </div>
  );
}

export function Droppable({
  id,
  children,
  className,
  label,
}: {
  id: string;
  children: ReactNode;
  className?: string;
  label: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <section
      ref={setNodeRef}
      aria-label={label}
      className={cn(
        className,
        'transition-colors duration-150',
        isOver && 'bg-accent-soft ring-2 ring-accent ring-inset',
      )}
    >
      {children}
    </section>
  );
}
