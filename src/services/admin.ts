/**
 * School admin API. Every call goes through a SECURITY DEFINER function that
 * checks is_admin() and writes the audit log (see 20261122000100_admin.sql).
 */
import type { AccountStatus, ClassSchedule, SchoolSettings, SubjectColor, UserRole } from '@/types';
import { appUrl, supabase } from '@/lib/supabase';
import { unwrap } from '@/stores/sync';
import { useSchoolStore, schoolFromRow, type SchoolSettingsRow } from '@/stores/schoolStore';
import { asColor, type MessageRow } from './rows';

export interface AdminStats {
  students: number;
  teachers: number;
  pending: number;
  suspended: number;
  archived_users: number;
  classes: number;
  archived_classes: number;
  messages_week: number;
  signups_week: number;
  active_week: number;
}

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  name: string;
  role: UserRole;
  status: AccountStatus;
  grade: string | null;
  avatarColor: SubjectColor;
  createdAt: string;
  archivedAt: string | null;
  lastSignInAt: string | null;
  emailConfirmed: boolean;
  classCount: number;
}

export interface UserDetail {
  teaches: { id: string; name: string; archived: boolean }[];
  enrolled: { id: string; name: string; archived: boolean }[];
  tasks: number;
  tasks_done: number;
  conversations: number;
  messages_sent: number;
  bookings: number;
  last_sign_in_at: string | null;
}

export interface AdminClass {
  id: string;
  name: string;
  subject: string;
  color: SubjectColor;
  room: string;
  schedule: ClassSchedule;
  joinCode: string;
  teacherId: string;
  teacherName: string;
  studentCount: number;
  createdAt: string;
  archivedAt: string | null;
}

export interface AdminConversation {
  id: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName: string;
  messageCount: number;
  lastMessageAt: string | null;
}

export interface AuditEntry {
  id: number;
  action: string;
  targetType: string;
  targetId: string | null;
  targetLabel: string;
  details: Record<string, unknown>;
  createdAt: string;
}

export interface RosterStudent {
  id: string;
  name: string;
  email: string;
  grade: string | null;
  avatarColor: SubjectColor;
}

interface UserRow {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  status: AccountStatus;
  grade: string | null;
  avatar_color: string;
  created_at: string;
  archived_at: string | null;
  last_sign_in_at: string | null;
  email_confirmed: boolean;
  class_count: number;
}

interface AdminClassRow {
  id: string;
  name: string;
  subject: string;
  color: string;
  room: string;
  schedule: ClassSchedule;
  join_code: string;
  teacher_id: string;
  teacher_name: string | null;
  student_count: number;
  created_at: string;
  archived_at: string | null;
}

interface ConversationListRow {
  id: string;
  student_id: string;
  student_name: string | null;
  teacher_id: string;
  teacher_name: string | null;
  message_count: number;
  last_message_at: string | null;
}

interface AuditRow {
  id: number;
  action: string;
  target_type: string;
  target_id: string | null;
  target_label: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

const displayName = (fullName: string, email: string) =>
  fullName.trim() || email.split('@')[0] || 'User';

async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  return unwrap(await supabase.rpc(fn, args)) as T;
}

export const adminService = {
  stats: () => rpc<AdminStats>('admin_stats'),

  async listUsers(): Promise<AdminUser[]> {
    const rows = await rpc<UserRow[]>('admin_list_users');
    return rows.map((r) => ({
      id: r.id,
      email: r.email,
      fullName: r.full_name,
      name: displayName(r.full_name, r.email),
      role: r.role,
      status: r.status,
      grade: r.grade,
      avatarColor: asColor(r.avatar_color),
      createdAt: r.created_at,
      archivedAt: r.archived_at,
      lastSignInAt: r.last_sign_in_at,
      emailConfirmed: r.email_confirmed,
      classCount: r.class_count,
    }));
  },

  userDetail: (id: string) => rpc<UserDetail>('admin_user_detail', { target: id }),

  setStatus: (id: string, status: AccountStatus) =>
    rpc<void>('admin_set_status', { target: id, new_status: status }),

  setRole: (id: string, role: 'student' | 'teacher') =>
    rpc<void>('admin_set_role', { target: id, new_role: role }),

  archiveUser: (id: string, archive: boolean) =>
    rpc<void>('admin_archive_user', { target: id, archive }),

  deleteUser: (id: string) => rpc<void>('admin_delete_user', { target: id }),

  /** Sends Supabase's normal password-reset email; the admin never sees or sets a password. */
  async sendPasswordReset(user: Pick<AdminUser, 'id' | 'email'>): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: appUrl('/reset-password'),
    });
    if (error) throw new Error(error.message);
    await rpc<void>('admin_record', { act: 'user.password_reset_sent', target: user.id });
  },

  async listClasses(): Promise<AdminClass[]> {
    const rows = await rpc<AdminClassRow[]>('admin_list_classes');
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      subject: r.subject,
      color: asColor(r.color),
      room: r.room,
      schedule: r.schedule,
      joinCode: r.join_code,
      teacherId: r.teacher_id,
      teacherName: r.teacher_name ?? 'Unknown teacher',
      studentCount: r.student_count,
      createdAt: r.created_at,
      archivedAt: r.archived_at,
    }));
  },

  async roster(classId: string): Promise<RosterStudent[]> {
    const members = unwrap(
      await supabase.from('class_members').select('student_id').eq('class_id', classId),
    ) as { student_id: string }[];
    if (members.length === 0) return [];
    const people = unwrap(
      await supabase
        .from('profiles')
        .select('id,email,full_name,grade,avatar_color')
        .in(
          'id',
          members.map((m) => m.student_id),
        ),
    ) as {
      id: string;
      email: string;
      full_name: string;
      grade: string | null;
      avatar_color: string;
    }[];
    return people
      .map((p) => ({
        id: p.id,
        name: displayName(p.full_name, p.email),
        email: p.email,
        grade: p.grade,
        avatarColor: asColor(p.avatar_color),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  archiveClass: (id: string, archive: boolean) =>
    rpc<void>('admin_archive_class', { cid: id, archive }),

  deleteClass: (id: string) => rpc<void>('admin_delete_class', { cid: id }),

  reassignClass: (id: string, teacherId: string) =>
    rpc<void>('admin_reassign_class', { cid: id, new_teacher: teacherId }),

  setMember: (classId: string, studentId: string, enrolled: boolean) =>
    rpc<void>('admin_set_member', { cid: classId, student: studentId, enrolled }),

  rotateJoinCode: (id: string) => rpc<string>('admin_rotate_join_code', { cid: id }),

  async listConversations(): Promise<AdminConversation[]> {
    const rows = await rpc<ConversationListRow[]>('admin_list_conversations');
    return rows.map((r) => ({
      id: r.id,
      studentId: r.student_id,
      studentName: r.student_name ?? 'Unknown student',
      teacherId: r.teacher_id,
      teacherName: r.teacher_name ?? 'Unknown teacher',
      messageCount: r.message_count,
      lastMessageAt: r.last_message_at,
    }));
  },

  /** Read-only. The server records this view in the audit log. */
  viewConversation: (id: string) => rpc<MessageRow[]>('admin_view_conversation', { cid: id }),

  async auditLog(limit = 300): Promise<AuditEntry[]> {
    const rows = unwrap(
      await supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit),
    ) as AuditRow[];
    return rows.map((r) => ({
      id: r.id,
      action: r.action,
      targetType: r.target_type,
      targetId: r.target_id,
      targetLabel: r.target_label,
      details: r.details ?? {},
      createdAt: r.created_at,
    }));
  },

  async updateSettings(patch: Record<string, unknown>): Promise<SchoolSettings> {
    const row = await rpc<SchoolSettingsRow>('admin_update_settings', { patch });
    const next = schoolFromRow(row);
    useSchoolStore.getState().set(next);
    return next;
  },
};
