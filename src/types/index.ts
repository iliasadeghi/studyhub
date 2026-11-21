export type SubjectColor =
  'blue' | 'green' | 'purple' | 'amber' | 'rose' | 'pink' | 'cyan' | 'lime';
export type AccentColor = 'indigo' | 'teal' | 'rose' | 'amber' | 'sky';
export type ThemeMode = 'light' | 'dark' | 'system';

export type TaskType = 'homework' | 'test' | 'project' | 'quiz' | 'reading' | 'personal';
export type Importance = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskView = 'list' | 'board' | 'matrix';
/** Eisenhower quadrants: do = urgent+important, schedule = important, delegate = urgent, eliminate = neither */
export type Quadrant = 'do' | 'schedule' | 'delegate' | 'eliminate';
export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low';

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface TaskLink {
  id: string;
  label: string;
  url: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  classId: string | null;
  type: TaskType;
  /** ISO date-time */
  dueAt: string;
  estimatedMinutes: number;
  importance: Importance;
  status: TaskStatus;
  subtasks: Subtask[];
  links: TaskLink[];
  createdAt: string;
  completedAt: string | null;
  /** Manual placement in the priority matrix; null = computed automatically */
  quadrantOverride: Quadrant | null;
}

export interface ClassSchedule {
  /** 0 = Sunday … 6 = Saturday */
  days: number[];
  /** "HH:mm" */
  start: string;
  end: string;
}

export interface ClassItem {
  id: string;
  name: string;
  subject: string;
  teacherId: string | null;
  color: SubjectColor;
  room: string;
  schedule: ClassSchedule;
}

export interface OfficeHour {
  day: number;
  start: string;
  end: string;
  location: string;
}

export type ContactMethod = 'email' | 'message' | 'in-person';

export interface Teacher {
  id: string;
  name: string;
  subjects: string[];
  email: string;
  officeHours: OfficeHour[];
  preferredContact: ContactMethod;
  bio: string;
}

export type NoteKind = 'teacher' | 'mine';

export interface Note {
  id: string;
  classId: string;
  unit: string;
  title: string;
  content: string;
  kind: NoteKind;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  teacherId: string;
  from: 'student' | 'teacher';
  body: string;
  sentAt: string;
  read: boolean;
}

export type EventKind = 'office-hours' | 'study' | 'event';

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  classId: string | null;
  teacherId: string | null;
  kind: EventKind;
  notes: string;
}

export interface UserSettings {
  name: string;
  grade: string;
  avatarColor: SubjectColor;
  theme: ThemeMode;
  accent: AccentColor;
  defaultTaskView: TaskView;
  weekStartsOn: 0 | 1;
  onboarded: boolean;
  notificationsEnabled: boolean;
}
