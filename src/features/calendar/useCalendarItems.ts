import { useMemo } from 'react';
import { format, isSameDay } from 'date-fns';
import type { CalendarEvent, ClassItem, SubjectColor, Task } from '@/types';
import { useTaskStore } from '@/stores/taskStore';
import { useEventStore } from '@/stores/eventStore';
import { useClassMap } from '@/stores/classStore';
import { suggestStudyBlocks, type StudyBlock } from '@/utils/studyPlan';

export type CalendarItem =
  | { kind: 'task'; id: string; title: string; date: Date; color: SubjectColor | null; task: Task }
  | {
      kind: 'event';
      id: string;
      title: string;
      date: Date;
      color: SubjectColor | null;
      event: CalendarEvent;
    }
  | {
      kind: 'study';
      id: string;
      title: string;
      date: Date;
      color: SubjectColor | null;
      block: StudyBlock;
    };

export const dayKey = (d: Date) => format(d, 'yyyy-MM-dd');

function colorOf(classId: string | null, classMap: Record<string, ClassItem>): SubjectColor | null {
  return classId && classMap[classId] ? classMap[classId].color : null;
}

/** Tasks, events and (optionally) suggested study blocks grouped by yyyy-MM-dd. */
export function useCalendarItems(showStudyPlan: boolean, now: Date) {
  const tasks = useTaskStore((s) => s.tasks);
  const events = useEventStore((s) => s.events);
  const classMap = useClassMap();

  return useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    const push = (item: CalendarItem) => {
      const k = dayKey(item.date);
      const list = map.get(k) ?? [];
      list.push(item);
      map.set(k, list);
    };

    for (const t of tasks) {
      push({
        kind: 'task',
        id: t.id,
        title: t.title,
        date: new Date(t.dueAt),
        color: colorOf(t.classId, classMap),
        task: t,
      });
    }
    for (const e of events) {
      push({
        kind: 'event',
        id: e.id,
        title: e.title,
        date: new Date(e.start),
        color: colorOf(e.classId, classMap),
        event: e,
      });
    }
    if (showStudyPlan) {
      for (const t of tasks) {
        for (const [i, b] of suggestStudyBlocks(t, now).entries()) {
          const accepted = events.some(
            (e) =>
              e.kind === 'study' && e.title === b.label && isSameDay(new Date(e.start), b.date),
          );
          if (!accepted) {
            push({
              kind: 'study',
              id: `study:${t.id}:${i}`,
              title: b.label,
              date: b.date,
              color: colorOf(t.classId, classMap),
              block: b,
            });
          }
        }
      }
    }
    for (const list of map.values()) {
      const rank = { event: 0, task: 1, study: 2 } as const;
      list.sort((a, b) => rank[a.kind] - rank[b.kind] || a.date.getTime() - b.date.getTime());
    }
    return map;
  }, [tasks, events, classMap, showStudyPlan, now]);
}
