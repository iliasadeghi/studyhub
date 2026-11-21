import { KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';

export function useDndSensors() {
  return useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 6 } }),
    useSensor(KeyboardSensor),
  );
}

type Id = string | number;

/** Screen reader announcements for drag & drop. */
export function makeAnnouncements(
  nameOf: (id: Id) => string,
  zoneOf: (id: Id | undefined) => string,
) {
  return {
    onDragStart: ({ active }: { active: { id: Id } }) => `Picked up ${nameOf(active.id)}.`,
    onDragOver: ({ active, over }: { active: { id: Id }; over: { id: Id } | null }) =>
      over
        ? `${nameOf(active.id)} is over ${zoneOf(over.id)}.`
        : `${nameOf(active.id)} is no longer over a drop area.`,
    onDragEnd: ({ active, over }: { active: { id: Id }; over: { id: Id } | null }) =>
      over
        ? `${nameOf(active.id)} was dropped in ${zoneOf(over.id)}.`
        : `${nameOf(active.id)} was dropped.`,
    onDragCancel: ({ active }: { active: { id: Id } }) =>
      `Dragging ${nameOf(active.id)} was cancelled.`,
  };
}
