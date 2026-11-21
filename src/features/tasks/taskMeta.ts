import {
  BookOpen,
  ClipboardCheck,
  FileText,
  FlaskConical,
  Hammer,
  User,
  type LucideIcon,
} from 'lucide-react';
import type { Importance, PriorityLevel, Quadrant, TaskStatus, TaskType } from '@/types';

export const TASK_TYPES: { id: TaskType; label: string; icon: LucideIcon }[] = [
  { id: 'homework', label: 'Homework', icon: FileText },
  { id: 'test', label: 'Test', icon: FlaskConical },
  { id: 'project', label: 'Project', icon: Hammer },
  { id: 'quiz', label: 'Quiz', icon: ClipboardCheck },
  { id: 'reading', label: 'Reading', icon: BookOpen },
  { id: 'personal', label: 'Personal', icon: User },
];

export const TYPE_META = Object.fromEntries(TASK_TYPES.map((t) => [t.id, t])) as Record<
  TaskType,
  (typeof TASK_TYPES)[number]
>;

export const IMPORTANCE_LABELS: Record<Importance, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export const STATUS_META: Record<
  TaskStatus,
  { label: string; tone: 'neutral' | 'info' | 'success' }
> = {
  todo: { label: 'To do', tone: 'neutral' },
  in_progress: { label: 'In progress', tone: 'info' },
  done: { label: 'Done', tone: 'success' },
};

export const STATUS_ORDER: TaskStatus[] = ['todo', 'in_progress', 'done'];

export const PRIORITY_META: Record<
  PriorityLevel,
  { label: string; tone: 'danger' | 'orange' | 'warning' | 'neutral'; rank: number }
> = {
  critical: { label: 'Critical', tone: 'danger', rank: 4 },
  high: { label: 'High', tone: 'orange', rank: 3 },
  medium: { label: 'Medium', tone: 'warning', rank: 2 },
  low: { label: 'Low', tone: 'neutral', rank: 1 },
};

export const QUADRANT_META: Record<
  Quadrant,
  { title: string; subtitle: string; hint: string; tone: string }
> = {
  do: {
    title: 'Do first',
    subtitle: 'Urgent + Important',
    hint: 'Tackle these today.',
    tone: 'var(--danger)',
  },
  schedule: {
    title: 'Schedule',
    subtitle: 'Important, not urgent',
    hint: 'Block time on your calendar.',
    tone: 'var(--accent)',
  },
  delegate: {
    title: 'Quick wins',
    subtitle: 'Urgent, less important',
    hint: 'Knock out fast, or ask for help.',
    tone: 'var(--warning)',
  },
  eliminate: {
    title: 'Later',
    subtitle: 'Neither',
    hint: 'Do when you have spare time.',
    tone: 'var(--text-muted)',
  },
};

export const QUADRANT_ORDER: Quadrant[] = ['do', 'schedule', 'delegate', 'eliminate'];
