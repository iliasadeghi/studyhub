/**
 * Loads (and clears) everything the signed-in user can see. Row Level Security
 * decides what each query returns, so the same queries work for both roles.
 */
import type { ClassItem, Contact, Message, OfficeHour, Profile } from '@/types';
import { supabase } from '@/lib/supabase';
import { useClassStore } from '@/stores/classStore';
import { useTaskStore } from '@/stores/taskStore';
import { useNoteStore } from '@/stores/noteStore';
import { useEventStore } from '@/stores/eventStore';
import { useTeacherStore } from '@/stores/teacherStore';
import { unwrap } from '@/stores/sync';
import {
  asColor,
  bookingFromRow,
  classFromRow,
  eventFromRow,
  noteFromRow,
  officeHourFromRow,
  taskFromRow,
  type BookingRow,
  type ClassRow,
  type ConversationRow,
  type EventRow,
  type MessageRow,
  type NoteRow,
  type OfficeHourRow,
  type ProfileRow,
  type TaskRow,
} from './rows';

interface MemberRow {
  class_id: string;
  student_id: string;
}

interface NoteViewRow {
  note_id: string;
  last_viewed: string | null;
  bookmarked: boolean;
}

export function contactFromProfile(
  p: ProfileRow,
  subjects: string[],
  officeHours: OfficeHour[] = [],
): Contact {
  return {
    id: p.id,
    role: p.role,
    name: p.full_name || p.email.split('@')[0] || 'User',
    subjects,
    email: p.email,
    officeHours,
    preferredContact: p.preferred_contact,
    bio: p.bio,
    avatarColor: asColor(p.avatar_color),
  };
}

export function messageFromRow(r: MessageRow, me: string, contactId: string): Message {
  return {
    id: r.id,
    conversationId: r.conversation_id,
    contactId,
    senderId: r.sender_id,
    mine: r.sender_id === me,
    body: r.body,
    sentAt: r.created_at,
    read: r.read_at !== null,
  };
}

const byIds = <T>(query: PromiseLike<{ data: T[] | null; error: { message: string } | null }>) =>
  query.then((r) => unwrap(r) ?? []);

export async function loadUserData(profile: Profile): Promise<void> {
  const me = profile.id;

  const [classRows, taskRows, eventRows, bookingRows, noteRows, viewRows, convRows] =
    await Promise.all([
      byIds<ClassRow>(supabase.from('classes').select('*').order('created_at')),
      byIds<TaskRow>(supabase.from('tasks').select('*').order('due_at')),
      byIds<EventRow>(supabase.from('events').select('*').order('starts_at')),
      byIds<BookingRow>(supabase.from('bookings').select('*').order('starts_at')),
      byIds<NoteRow>(supabase.from('notes').select('*').order('updated_at', { ascending: false })),
      byIds<NoteViewRow>(supabase.from('note_views').select('note_id,last_viewed,bookmarked')),
      byIds<ConversationRow>(supabase.from('conversations').select('*')),
    ]);

  const classes: ClassItem[] = classRows.map(classFromRow);
  const classIds = classes.map((c) => c.id);

  // --- People: your teachers (student) or your students (teacher) ---
  const contactSubjects = new Map<string, string[]>();
  const addSubject = (id: string, className: string) =>
    contactSubjects.set(id, [...(contactSubjects.get(id) ?? []), className]);
  let memberRows: MemberRow[] = [];

  if (profile.role === 'teacher') {
    memberRows = classIds.length
      ? await byIds<MemberRow>(
          supabase.from('class_members').select('class_id,student_id').in('class_id', classIds),
        )
      : [];
    for (const m of memberRows)
      addSubject(m.student_id, classes.find((c) => c.id === m.class_id)?.name ?? '');
  } else {
    for (const c of classes) if (c.teacherId) addSubject(c.teacherId, c.name);
  }

  // People you have conversations with but no longer share a class with.
  const conversations: Record<string, string> = {};
  for (const c of convRows) {
    const other = c.student_id === me ? c.teacher_id : c.student_id;
    conversations[other] = c.id;
    if (!contactSubjects.has(other)) contactSubjects.set(other, []);
  }

  const peopleIds = [...contactSubjects.keys()];
  const [profileRows, hourRows, messageRows] = await Promise.all([
    peopleIds.length
      ? byIds<ProfileRow>(supabase.from('profiles').select('*').in('id', peopleIds))
      : Promise.resolve([]),
    byIds<OfficeHourRow>(supabase.from('office_hours').select('*').order('day')),
    convRows.length
      ? byIds<MessageRow>(
          supabase
            .from('messages')
            .select('*')
            .in(
              'conversation_id',
              convRows.map((c) => c.id),
            )
            .order('created_at')
            .limit(2000),
        )
      : Promise.resolve([]),
  ]);

  const hoursFor = (id: string) =>
    hourRows.filter((h) => h.teacher_id === id).map(officeHourFromRow);
  const contacts = profileRows.map((p) =>
    contactFromProfile(p, contactSubjects.get(p.id) ?? [], hoursFor(p.id)),
  );

  const convToContact = Object.fromEntries(
    Object.entries(conversations).map(([contact, conv]) => [conv, contact]),
  );
  const messages = messageRows.map((r) => messageFromRow(r, me, convToContact[r.conversation_id]));

  const rosters: Record<string, Contact[]> = {};
  if (profile.role === 'teacher') {
    for (const c of classes) {
      rosters[c.id] = memberRows
        .filter((m) => m.class_id === c.id)
        .map((m) => contacts.find((p) => p.id === m.student_id))
        .filter((p): p is Contact => Boolean(p));
    }
  }

  useClassStore.getState().hydrate(classes, rosters);
  useTaskStore.getState().hydrate(taskRows.map(taskFromRow));
  useEventStore.getState().hydrate(eventRows.map(eventFromRow), bookingRows.map(bookingFromRow));
  useNoteStore.getState().hydrate({
    notes: noteRows.map(noteFromRow),
    bookmarks: viewRows.filter((v) => v.bookmarked).map((v) => v.note_id),
    lastViewed: Object.fromEntries(
      viewRows.filter((v) => v.last_viewed).map((v) => [v.note_id, v.last_viewed as string]),
    ),
  });
  useTeacherStore.getState().hydrate({
    teachers: contacts,
    conversations,
    messages,
    myOfficeHours: profile.role === 'teacher' ? hoursFor(me) : [],
  });
}

export function clearUserData(): void {
  useClassStore.getState().reset();
  useTaskStore.getState().reset();
  useEventStore.getState().reset();
  useNoteStore.getState().reset();
  useTeacherStore.getState().reset();
}
