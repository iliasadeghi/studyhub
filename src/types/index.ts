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
  /** Code students use to join (visible to the class teacher and members) */
  joinCode: string;
}

export type UserRole = 'student' | 'teacher' | 'admin';
export type AccountStatus = 'active' | 'pending' | 'suspended';

/** The signed-in user's own profile row. */
export interface Profile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  grade: string | null;
  avatarColor: SubjectColor;
  bio: string;
  preferredContact: ContactMethod;
  onboarded: boolean;
  status: AccountStatus;
  archivedAt: string | null;
}

export interface OfficeHour {
  id?: string;
  day: number;
  start: string;
  end: string;
  location: string;
}

export type ContactMethod = 'email' | 'message' | 'in-person';

/** Another user you can see: your teachers (if you're a student) or your students (if you teach). */
export interface Teacher {
  id: string;
  role: UserRole;
  name: string;
  /** Names of the classes you share */
  subjects: string[];
  email: string;
  officeHours: OfficeHour[];
  preferredContact: ContactMethod;
  bio: string;
  avatarColor: SubjectColor;
}
export type Contact = Teacher;

export type NoteKind = 'teacher' | 'mine';
export type NoteVisibility = 'private' | 'class';

export interface Note {
  id: string;
  classId: string;
  authorId: string;
  unit: string;
  title: string;
  content: string;
  /** 'teacher' = shared with the class, 'mine' = private to the author */
  kind: NoteKind;
  visibility: NoteVisibility;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  /** The other person in the conversation */
  contactId: string;
  senderId: string;
  /** Sent by the signed-in user */
  mine: boolean;
  body: string;
  sentAt: string;
  /** For incoming messages: you've read it. For your messages: they've read it. */
  read: boolean;
  /** Optimistic message not yet confirmed by the server */
  pending?: boolean;
}

export interface Booking {
  id: string;
  teacherId: string;
  studentId: string;
  start: string;
  end: string;
  topic: string;
  location: string;
  status: 'booked' | 'cancelled';
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

/** Per-device preferences (stored locally, not in the database). */
export interface UserSettings {
  theme: ThemeMode;
  accent: AccentColor;
  /** False until the user picks an accent; until then the school's color is used */
  accentChosen: boolean;
  defaultTaskView: TaskView;
  weekStartsOn: 0 | 1;
  notificationsEnabled: boolean;
}

export type FeatureKey =
  'messaging' | 'student_start' | 'office_hours' | 'class_notes' | 'private_notes';
export type AnnouncementTone = 'info' | 'success' | 'warning' | 'danger';
export type SignupPolicy = 'open' | 'domain' | 'closed';

/** School-wide settings managed by the admin. */
export interface SchoolSettings {
  schoolName: string;
  announcement: string;
  announcementTone: AnnouncementTone;
  /** When the announcement text last changed (re-shows dismissed banners) */
  announcementAt: string | null;
  accent: AccentColor;
  signupPolicy: SignupPolicy;
  allowedDomain: string;
  teacherApproval: boolean;
  features: Record<FeatureKey, boolean>;
}
