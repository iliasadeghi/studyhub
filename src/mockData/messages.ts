import type { CalendarEvent, Message } from '@/types';

function ago(now: Date, days: number, hour: number, minute = 0): string {
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export function createSampleMessages(now: Date): Message[] {
  const m = (
    id: string,
    teacherId: string,
    from: Message['from'],
    body: string,
    sentAt: string,
    read = true,
  ): Message => ({
    id,
    teacherId,
    from,
    body,
    sentAt,
    read,
  });
  return [
    m(
      'msg_1',
      't_chen',
      'student',
      'Hi Ms. Chen! For problem 18 on the factoring worksheet, are we supposed to factor completely or just pull out the GCF?',
      ago(now, 3, 16, 12),
    ),
    m(
      'msg_2',
      't_chen',
      'teacher',
      'Great question — factor completely! After the GCF you should still be able to factor the trinomial. Come by Monday after school if you want to check your answer.',
      ago(now, 3, 17, 40),
    ),
    m('msg_3', 't_chen', 'student', 'Got it, thank you!', ago(now, 3, 17, 45)),
    m(
      'msg_4',
      't_patel',
      'student',
      'Hey Mx. Patel, my inventory list keeps resetting every time I enter a new room. Any hints?',
      ago(now, 1, 19, 5),
    ),
    m(
      'msg_5',
      't_patel',
      'teacher',
      'Sounds like you might be creating the list inside your room function. Try defining `inventory = []` once at the top of your program and passing it in. Happy to look at it Thursday!',
      ago(now, 1, 20, 30),
      false,
    ),
    m(
      'msg_6',
      't_alvarez',
      'teacher',
      'Reminder: bring a printed copy of your personal narrative draft for peer review on Friday. Digital copies are fine if you have a laptop.',
      ago(now, 2, 8, 15),
    ),
    m(
      'msg_7',
      't_alvarez',
      'student',
      'Will do! Is it okay if my draft is a little over 1200 words?',
      ago(now, 2, 15, 50),
    ),
    m(
      'msg_8',
      't_alvarez',
      'teacher',
      'A little over is fine for a first draft — we will work on trimming during revision.',
      ago(now, 2, 16, 20),
      false,
    ),
  ];
}

export function createSampleEvents(now: Date): CalendarEvent[] {
  const day = (offset: number, hour: number, minute = 0) => {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
  };
  return [
    {
      id: 'event_seed_1',
      title: 'Office hours: Ms. Chen',
      start: day(2, 15, 15),
      end: day(2, 15, 45),
      classId: 'c_math',
      teacherId: 't_chen',
      kind: 'office-hours',
      notes: 'Go over synthetic division before the test.',
    },
    {
      id: 'event_seed_2',
      title: 'Science Fair info session',
      start: day(5, 12, 10),
      end: day(5, 12, 50),
      classId: 'c_bio',
      teacherId: null,
      kind: 'event',
      notes: 'Library, bring lunch.',
    },
    {
      id: 'event_seed_3',
      title: 'Spanish conversation table',
      start: day(1, 15, 15),
      end: day(1, 16, 0),
      classId: 'c_span',
      teacherId: 't_moreno',
      kind: 'event',
      notes: '',
    },
  ];
}
