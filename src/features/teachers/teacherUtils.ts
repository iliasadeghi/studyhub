import { addDays, startOfDay } from 'date-fns';
import type { ContactMethod, Teacher } from '@/types';

export const CONTACT_LABELS: Record<ContactMethod, string> = {
  email: 'Email',
  message: 'In-app message',
  'in-person': 'In person',
};

export interface Slot {
  key: string;
  start: Date;
  location: string;
}

/** Upcoming 15-minute slots within the teacher's office hours over the next `days` days. */
export function upcomingSlots(teacher: Teacher, now: Date, days = 14): Slot[] {
  const slots: Slot[] = [];
  for (let i = 0; i < days; i++) {
    const day = addDays(startOfDay(now), i);
    for (const oh of teacher.officeHours.filter((o) => o.day === day.getDay())) {
      const [sh, sm] = oh.start.split(':').map(Number);
      const [eh, em] = oh.end.split(':').map(Number);
      for (let m = sh * 60 + sm; m + 15 <= eh * 60 + em; m += 15) {
        const start = new Date(day);
        start.setHours(Math.floor(m / 60), m % 60, 0, 0);
        if (start > now) slots.push({ key: start.toISOString(), start, location: oh.location });
      }
    }
  }
  return slots;
}
