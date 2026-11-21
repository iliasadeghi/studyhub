import type { CalendarEvent, ClassItem, Message, Note, Task, Teacher } from '@/types';
import { SAMPLE_CLASSES, SAMPLE_TEACHERS } from './classes';
import { createSampleTasks } from './tasks';
import { createSampleEvents, createSampleMessages } from './messages';
import { STEM_NOTES } from './notesStem';
import { HUMANITIES_NOTES } from './notesHumanities';

export interface SampleData {
  classes: ClassItem[];
  teachers: Teacher[];
  tasks: Task[];
  notes: Note[];
  bookmarks: string[];
  lastViewed: Record<string, string>;
  messages: Message[];
  events: CalendarEvent[];
}

function daysAgo(now: Date, days: number): string {
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  d.setHours(15, 30, 0, 0);
  return d.toISOString();
}

function createNotes(now: Date): Note[] {
  const teacherNotes: Note[] = [...STEM_NOTES, ...HUMANITIES_NOTES].map((n, i) => ({
    id: `note_seed_${i + 1}`,
    classId: n.classId,
    unit: n.unit,
    title: n.title,
    content: n.content,
    kind: 'teacher',
    createdAt: daysAgo(now, n.daysAgo),
    updatedAt: daysAgo(now, n.daysAgo),
  }));
  const mine: Note = {
    id: 'note_mine_1',
    classId: 'c_math',
    unit: 'Unit 3 · Polynomials',
    title: 'My test prep notes',
    kind: 'mine',
    createdAt: daysAgo(now, 1),
    updatedAt: daysAgo(now, 1),
    content: `# Unit 3 test — things I keep forgetting

- **Placeholder zeros** in long division!!
- Remainder theorem: f(k) = remainder
- Sum of cubes: a³ + b³ = (a + b)(a² − ab + b²)

## Questions for Ms. Chen
1. Do we need to know the rational root theorem?
2. Is a calculator allowed on part 2?
`,
  };
  return [mine, ...teacherNotes];
}

export function createSampleData(now: Date = new Date()): SampleData {
  const notes = createNotes(now);
  return {
    classes: structuredClone(SAMPLE_CLASSES),
    teachers: structuredClone(SAMPLE_TEACHERS),
    tasks: createSampleTasks(now),
    notes,
    bookmarks: ['note_seed_1', 'note_seed_4'],
    lastViewed: {
      note_seed_4: daysAgo(now, 0),
      note_seed_2: daysAgo(now, 1),
      note_mine_1: daysAgo(now, 1),
      note_seed_12: daysAgo(now, 2),
    },
    messages: createSampleMessages(now),
    events: createSampleEvents(now),
  };
}

let cached: SampleData | null = null;

/** Sample data generated once per page load (stores use it as their initial state). */
export function getSampleData(): SampleData {
  if (!cached) cached = createSampleData();
  return cached;
}
