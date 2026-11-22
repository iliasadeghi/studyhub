/**
 * Database row shapes (snake_case) and mappers to the app's types.
 * Keep these in sync with supabase/migrations.
 */
import type {
  AccountStatus,
  Booking,
  CalendarEvent,
  ClassItem,
  ClassSchedule,
  ContactMethod,
  Importance,
  Note,
  NoteVisibility,
  OfficeHour,
  Profile,
  Quadrant,
  Subtask,
  SubjectColor,
  Task,
  TaskLink,
  TaskStatus,
  TaskType,
  UserRole,
  EventKind,
} from '@/types';

export interface ProfileRow {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  grade: string | null;
  avatar_color: string;
  bio: string;
  preferred_contact: ContactMethod;
  onboarded: boolean;
  status?: AccountStatus;
  archived_at?: string | null;
}

export interface ClassRow {
  id: string;
  teacher_id: string;
  name: string;
  subject: string;
  color: string;
  room: string;
  schedule: ClassSchedule;
  join_code: string;
}

export interface TaskRow {
  id: string;
  owner_id: string;
  class_id: string | null;
  title: string;
  description: string;
  type: TaskType;
  due_at: string;
  estimated_minutes: number;
  importance: Importance;
  status: TaskStatus;
  subtasks: Subtask[];
  links: TaskLink[];
  quadrant_override: Quadrant | null;
  completed_at: string | null;
  created_at: string;
}

export interface NoteRow {
  id: string;
  class_id: string;
  author_id: string;
  unit: string;
  title: string;
  content: string;
  visibility: NoteVisibility;
  created_at: string;
  updated_at: string;
}

export interface EventRow {
  id: string;
  owner_id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  class_id: string | null;
  kind: EventKind;
  notes: string;
}

export interface OfficeHourRow {
  id: string;
  teacher_id: string;
  day: number;
  start_time: string;
  end_time: string;
  location: string;
}

export interface BookingRow {
  id: string;
  teacher_id: string;
  student_id: string;
  starts_at: string;
  ends_at: string;
  topic: string;
  location: string;
  status: 'booked' | 'cancelled';
}

export interface ConversationRow {
  id: string;
  student_id: string;
  teacher_id: string;
}

export interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
}

const COLORS: SubjectColor[] = ['blue', 'green', 'purple', 'amber', 'rose', 'pink', 'cyan', 'lime'];
export const asColor = (c: string): SubjectColor =>
  COLORS.includes(c as SubjectColor) ? (c as SubjectColor) : 'blue';

/** "HH:mm:ss" (Postgres time) → "HH:mm" */
const hhmm = (t: string) => t.slice(0, 5);

export const profileFromRow = (r: ProfileRow): Profile => ({
  id: r.id,
  email: r.email,
  fullName: r.full_name,
  role: r.role,
  grade: r.grade,
  avatarColor: asColor(r.avatar_color),
  bio: r.bio,
  preferredContact: r.preferred_contact,
  onboarded: r.onboarded,
  status: r.status ?? 'active',
  archivedAt: r.archived_at ?? null,
});

export const classFromRow = (r: ClassRow): ClassItem => ({
  id: r.id,
  name: r.name,
  subject: r.subject,
  teacherId: r.teacher_id,
  color: asColor(r.color),
  room: r.room,
  schedule: r.schedule,
  joinCode: r.join_code,
});

export const classToRow = (c: Partial<ClassItem>) => ({
  ...(c.name !== undefined && { name: c.name }),
  ...(c.subject !== undefined && { subject: c.subject }),
  ...(c.color !== undefined && { color: c.color }),
  ...(c.room !== undefined && { room: c.room }),
  ...(c.schedule !== undefined && { schedule: c.schedule }),
});

export const taskFromRow = (r: TaskRow): Task => ({
  id: r.id,
  title: r.title,
  description: r.description,
  classId: r.class_id,
  type: r.type,
  dueAt: r.due_at,
  estimatedMinutes: r.estimated_minutes,
  importance: r.importance,
  status: r.status,
  subtasks: r.subtasks ?? [],
  links: r.links ?? [],
  createdAt: r.created_at,
  completedAt: r.completed_at,
  quadrantOverride: r.quadrant_override,
});

export function taskToRow(t: Partial<Task>) {
  const row: Partial<TaskRow> = {};
  if (t.id !== undefined) row.id = t.id;
  if (t.title !== undefined) row.title = t.title;
  if (t.description !== undefined) row.description = t.description;
  if (t.classId !== undefined) row.class_id = t.classId;
  if (t.type !== undefined) row.type = t.type;
  if (t.dueAt !== undefined) row.due_at = t.dueAt;
  if (t.estimatedMinutes !== undefined) row.estimated_minutes = t.estimatedMinutes;
  if (t.importance !== undefined) row.importance = t.importance;
  if (t.status !== undefined) row.status = t.status;
  if (t.subtasks !== undefined) row.subtasks = t.subtasks;
  if (t.links !== undefined) row.links = t.links;
  if (t.quadrantOverride !== undefined) row.quadrant_override = t.quadrantOverride;
  if (t.completedAt !== undefined) row.completed_at = t.completedAt;
  if (t.createdAt !== undefined) row.created_at = t.createdAt;
  return row;
}

export const noteFromRow = (r: NoteRow): Note => ({
  id: r.id,
  classId: r.class_id,
  authorId: r.author_id,
  unit: r.unit,
  title: r.title,
  content: r.content,
  visibility: r.visibility,
  kind: r.visibility === 'class' ? 'teacher' : 'mine',
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export const eventFromRow = (r: EventRow): CalendarEvent => ({
  id: r.id,
  title: r.title,
  start: r.starts_at,
  end: r.ends_at,
  classId: r.class_id,
  teacherId: null,
  kind: r.kind,
  notes: r.notes,
});

export function eventToRow(e: Partial<CalendarEvent>) {
  const row: Partial<EventRow> = {};
  if (e.id !== undefined) row.id = e.id;
  if (e.title !== undefined) row.title = e.title;
  if (e.start !== undefined) row.starts_at = e.start;
  if (e.end !== undefined) row.ends_at = e.end;
  if (e.classId !== undefined) row.class_id = e.classId;
  if (e.kind !== undefined) row.kind = e.kind;
  if (e.notes !== undefined) row.notes = e.notes;
  return row;
}

export const officeHourFromRow = (r: OfficeHourRow): OfficeHour => ({
  id: r.id,
  day: r.day,
  start: hhmm(r.start_time),
  end: hhmm(r.end_time),
  location: r.location,
});

export const bookingFromRow = (r: BookingRow): Booking => ({
  id: r.id,
  teacherId: r.teacher_id,
  studentId: r.student_id,
  start: r.starts_at,
  end: r.ends_at,
  topic: r.topic,
  location: r.location,
  status: r.status,
});
