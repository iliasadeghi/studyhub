import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CalendarEvent } from '@/types';
import { uid } from '@/utils/id';
import { getSampleData } from '@/mockData';
import { STORE_VERSION, storageKey } from './persist';

interface EventState {
  events: CalendarEvent[];
  addEvent: (input: Omit<CalendarEvent, 'id'>) => CalendarEvent;
  updateEvent: (id: string, patch: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  replaceAll: (events: CalendarEvent[]) => void;
}

export const useEventStore = create<EventState>()(
  persist(
    (set) => ({
      events: getSampleData().events,
      addEvent: (input) => {
        const event = { ...input, id: uid('event') };
        set((s) => ({ events: [...s.events, event] }));
        return event;
      },
      updateEvent: (id, patch) =>
        set((s) => ({ events: s.events.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),
      deleteEvent: (id) => set((s) => ({ events: s.events.filter((e) => e.id !== id) })),
      replaceAll: (events) => set({ events }),
    }),
    { name: storageKey('events'), version: STORE_VERSION },
  ),
);
