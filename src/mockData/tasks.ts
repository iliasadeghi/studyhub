import type { Task } from '@/types';

type Seed = Omit<
  Task,
  | 'id'
  | 'createdAt'
  | 'completedAt'
  | 'quadrantOverride'
  | 'dueAt'
  | 'subtasks'
  | 'links'
  | 'description'
> & {
  /** days from today */
  due: number;
  hour?: number;
  minute?: number;
  description?: string;
  subtasks?: [string, boolean][];
  links?: [string, string][];
  /** days from today when completed (negative = past) */
  doneDay?: number;
};

const SEEDS: Seed[] = [
  // ---- Past / overdue ----
  {
    title: 'Lab report: Enzyme activity',
    classId: 'c_bio',
    type: 'homework',
    due: -1,
    hour: 23,
    minute: 59,
    estimatedMinutes: 90,
    importance: 'high',
    status: 'in_progress',
    description:
      'Write up the catalase + hydrogen peroxide lab. Include a data table, a graph of reaction rate vs. temperature, and a conclusion.',
    subtasks: [
      ['Data table', true],
      ['Graph', true],
      ['Discussion section', false],
      ['Conclusion', false],
    ],
    links: [['Lab handout', 'https://example.com/biology/enzyme-lab']],
  },
  {
    title: 'Vocab flashcards — Unit 4',
    classId: 'c_span',
    type: 'homework',
    due: -2,
    hour: 8,
    estimatedMinutes: 20,
    importance: 'low',
    status: 'todo',
  },
  {
    title: 'Quadratic formula worksheet',
    classId: 'c_math',
    type: 'homework',
    due: -3,
    hour: 8,
    estimatedMinutes: 40,
    importance: 'medium',
    status: 'done',
    doneDay: -4,
  },
  {
    title: 'Read "The Things They Carried" pp. 1–30',
    classId: 'c_eng',
    type: 'reading',
    due: -2,
    hour: 10,
    estimatedMinutes: 45,
    importance: 'medium',
    status: 'done',
    doneDay: -3,
  },
  {
    title: 'Python loops practice set',
    classId: 'c_cs',
    type: 'homework',
    due: -1,
    hour: 14,
    estimatedMinutes: 35,
    importance: 'medium',
    status: 'done',
    doneDay: -1,
  },
  {
    title: 'Primary source analysis: Magna Carta',
    classId: 'c_hist',
    type: 'homework',
    due: -5,
    hour: 11,
    estimatedMinutes: 50,
    importance: 'medium',
    status: 'done',
    doneDay: -5,
  },
  {
    title: 'Cell organelles quiz',
    classId: 'c_bio',
    type: 'quiz',
    due: -6,
    hour: 9,
    estimatedMinutes: 30,
    importance: 'high',
    status: 'done',
    doneDay: -6,
  },
  {
    title: 'Clean out backpack + binder',
    classId: null,
    type: 'personal',
    due: -2,
    hour: 19,
    estimatedMinutes: 15,
    importance: 'low',
    status: 'done',
    doneDay: -2,
  },
  // ---- Today ----
  {
    title: 'Factoring polynomials — problems 1–24',
    classId: 'c_math',
    type: 'homework',
    due: 0,
    hour: 23,
    minute: 59,
    estimatedMinutes: 45,
    importance: 'medium',
    status: 'todo',
    description: 'Odd problems only for 1–15, then all of 16–24. Show your work!',
  },
  {
    title: 'Spanish preterite vs. imperfect quiz',
    classId: 'c_span',
    type: 'quiz',
    due: 0,
    hour: 13,
    estimatedMinutes: 30,
    importance: 'high',
    status: 'todo',
    subtasks: [
      ['Review conjugation chart', true],
      ['Do practice quiz online', false],
    ],
  },
  {
    title: 'Practice piano — 20 minutes',
    classId: null,
    type: 'personal',
    due: 0,
    hour: 20,
    estimatedMinutes: 20,
    importance: 'low',
    status: 'todo',
  },
  // ---- Tomorrow ----
  {
    title: 'Discussion questions: Chapter 3',
    classId: 'c_eng',
    type: 'homework',
    due: 1,
    hour: 10,
    estimatedMinutes: 30,
    importance: 'medium',
    status: 'todo',
  },
  {
    title: 'Read textbook 7.2 — Photosynthesis',
    classId: 'c_bio',
    type: 'reading',
    due: 1,
    hour: 9,
    estimatedMinutes: 25,
    importance: 'low',
    status: 'todo',
  },
  // ---- This week ----
  {
    title: 'Unit 3 Test: Polynomials',
    classId: 'c_math',
    type: 'test',
    due: 3,
    hour: 8,
    estimatedMinutes: 150,
    importance: 'high',
    status: 'todo',
    description:
      'Covers sections 3.1–3.6: factoring, polynomial division, remainder theorem, and graphing.',
    subtasks: [
      ['Redo review packet', false],
      ['Watch Khan Academy videos on synthetic division', false],
      ['Make a formula sheet', false],
    ],
    links: [['Review packet (PDF)', 'https://example.com/algebra/unit3-review']],
  },
  {
    title: 'Build a text adventure game in Python',
    classId: 'c_cs',
    type: 'project',
    due: 4,
    hour: 14,
    estimatedMinutes: 240,
    importance: 'high',
    status: 'in_progress',
    description:
      'At least 5 rooms, an inventory system, and one puzzle. Submit via the class repo.',
    subtasks: [
      ['Plan the map', true],
      ['Room navigation', true],
      ['Inventory system', false],
      ['Puzzle + win condition', false],
      ['Write README', false],
    ],
    links: [
      ['Starter code', 'https://example.com/cs/text-adventure-starter'],
      ['Rubric', 'https://example.com/cs/rubric'],
    ],
  },
  {
    title: 'Industrial Revolution reading guide',
    classId: 'c_hist',
    type: 'reading',
    due: 2,
    hour: 11,
    estimatedMinutes: 40,
    importance: 'medium',
    status: 'todo',
  },
  {
    title: 'Personal narrative — first draft',
    classId: 'c_eng',
    type: 'project',
    due: 5,
    hour: 10,
    estimatedMinutes: 120,
    importance: 'high',
    status: 'todo',
    description:
      '800–1200 words about a moment that changed how you see something. Bring a printed copy for peer review.',
    subtasks: [
      ['Brainstorm 3 moments', true],
      ['Outline', false],
      ['Draft', false],
    ],
  },
  {
    title: 'Study group: Biology Unit 5',
    classId: 'c_bio',
    type: 'personal',
    due: 2,
    hour: 16,
    estimatedMinutes: 60,
    importance: 'medium',
    status: 'todo',
  },
  {
    title: 'Spanish oral presentation prep',
    classId: 'c_span',
    type: 'project',
    due: 6,
    hour: 13,
    estimatedMinutes: 90,
    importance: 'medium',
    status: 'todo',
    description:
      '3-minute presentation: "Mi ciudad ideal". Use at least 10 new vocab words and the future tense.',
  },
  // ---- Later ----
  {
    title: 'Biology Unit 5 Test: Photosynthesis & Respiration',
    classId: 'c_bio',
    type: 'test',
    due: 9,
    hour: 9,
    estimatedMinutes: 180,
    importance: 'high',
    status: 'todo',
    subtasks: [
      ['Review notes 7.1–7.4', false],
      ['Practice diagrams', false],
      ['Old quiz corrections', false],
    ],
  },
  {
    title: 'History research project: Proposal',
    classId: 'c_hist',
    type: 'project',
    due: 12,
    hour: 11,
    estimatedMinutes: 120,
    importance: 'medium',
    status: 'todo',
    description:
      'One-page proposal: topic, research question, and 3 sources (at least one primary).',
  },
  {
    title: 'Read "The Things They Carried" pp. 31–80',
    classId: 'c_eng',
    type: 'reading',
    due: 8,
    hour: 10,
    estimatedMinutes: 60,
    importance: 'low',
    status: 'todo',
  },
  {
    title: 'Midterm review: Algebra II',
    classId: 'c_math',
    type: 'test',
    due: 18,
    hour: 8,
    estimatedMinutes: 240,
    importance: 'high',
    status: 'todo',
  },
  {
    title: 'Sign up for Science Olympiad',
    classId: null,
    type: 'personal',
    due: 10,
    hour: 15,
    estimatedMinutes: 10,
    importance: 'medium',
    status: 'todo',
    links: [['Sign-up form', 'https://example.com/clubs/science-olympiad']],
  },
  {
    title: 'CS quiz: Functions & scope',
    classId: 'c_cs',
    type: 'quiz',
    due: 7,
    hour: 14,
    estimatedMinutes: 30,
    importance: 'medium',
    status: 'todo',
  },
];

function at(now: Date, dayOffset: number, hour = 23, minute = 0): string {
  const d = new Date(now);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export function createSampleTasks(now: Date): Task[] {
  return SEEDS.map((s, i) => ({
    id: `task_seed_${i + 1}`,
    title: s.title,
    description: s.description ?? '',
    classId: s.classId,
    type: s.type,
    dueAt: at(now, s.due, s.hour, s.minute),
    estimatedMinutes: s.estimatedMinutes,
    importance: s.importance,
    status: s.status,
    subtasks: (s.subtasks ?? []).map(([title, done], j) => ({ id: `st_${i}_${j}`, title, done })),
    links: (s.links ?? []).map(([label, url], j) => ({ id: `ln_${i}_${j}`, label, url })),
    createdAt: at(now, Math.min(s.due, 0) - 7, 9),
    completedAt: s.status === 'done' ? at(now, s.doneDay ?? s.due, 18) : null,
    quadrantOverride: null,
  }));
}
