import { create } from 'zustand';
import type { Booking, CalendarEvent } from '@/types';
import { supabase } from '@/lib/supabase';
import { bookingFromRow, eventToRow, type BookingRow } from '@/services/rows';
import { newId, remote, unwrap } from './sync';

interface EventState {
  events: CalendarEvent[];
  /** Office-hour bookings you're part of (as the student or the teacher) */
  bookings: Booking[];
  hydrate: (events: CalendarEvent[], bookings: Booking[]) => void;
  reset: () => void;
  addEvent: (input: Omit<CalendarEvent, 'id'>) => CalendarEvent;
  updateEvent: (id: string, patch: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  /** Students: book an office-hour slot with a teacher. */
  bookOfficeHours: (input: Omit<Booking, 'id' | 'studentId' | 'status'>) => Promise<Booking>;
  cancelBooking: (id: string) => void;
}

export const useEventStore = create<EventState>()((set, get) => ({
  events: [],
  bookings: [],
  hydrate: (events, bookings) => set({ events, bookings }),
  reset: () => set({ events: [], bookings: [] }),
  addEvent: (input) => {
    const event = { ...input, id: newId() };
    const before = get().events;
    set({ events: [...before, event] });
    void remote(
      supabase.from('events').insert(eventToRow(event)),
      () => set({ events: before }),
      'add the event',
    );
    return event;
  },
  updateEvent: (id, patch) => {
    const before = get().events;
    set({ events: before.map((e) => (e.id === id ? { ...e, ...patch } : e)) });
    void remote(
      supabase
        .from('events')
        .update(eventToRow({ ...patch, id: undefined }))
        .eq('id', id),
      () => set({ events: before }),
      'save the event',
    );
  },
  deleteEvent: (id) => {
    const before = get().events;
    set({ events: before.filter((e) => e.id !== id) });
    void remote(
      supabase.from('events').delete().eq('id', id),
      () => set({ events: before }),
      'delete the event',
    );
  },
  bookOfficeHours: async (input) => {
    const row = unwrap(
      await supabase
        .from('bookings')
        .insert({
          teacher_id: input.teacherId,
          starts_at: input.start,
          ends_at: input.end,
          topic: input.topic,
          location: input.location,
        })
        .select()
        .single<BookingRow>(),
    );
    const booking = bookingFromRow(row);
    set((s) => ({ bookings: [...s.bookings, booking] }));
    return booking;
  },
  cancelBooking: (id) => {
    const before = get().bookings;
    set({ bookings: before.map((b) => (b.id === id ? { ...b, status: 'cancelled' } : b)) });
    void remote(
      supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id),
      () => set({ bookings: before }),
      'cancel the booking',
    );
  },
}));
