/**
 * Teachers: live roster. When a student joins one of your classes, add them to
 * the class roster and your contacts without a page reload.
 */
import { supabase } from '@/lib/supabase';
import { useClassStore } from '@/stores/classStore';
import { useTeacherStore } from '@/stores/teacherStore';
import { toast } from '@/stores/uiStore';
import { contactFromProfile } from './userData';
import type { ProfileRow } from './rows';

interface MemberRow {
  class_id: string;
  student_id: string;
}

export function subscribeToRoster(teacherId: string): () => void {
  const channel = supabase
    .channel(`roster:${teacherId}`)
    .on<MemberRow>(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'class_members' },
      async ({ new: row }) => {
        const cls = useClassStore.getState().classes.find((c) => c.id === row.class_id);
        if (!cls) return;
        const { data: p } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', row.student_id)
          .maybeSingle<ProfileRow>();
        if (!p) return;

        const people = useTeacherStore.getState();
        const existing = people.teachers.find((t) => t.id === p.id);
        const subjects = [...new Set([...(existing?.subjects ?? []), cls.name])];
        const contact = contactFromProfile(p, subjects);
        people.upsertContact(contact);
        useClassStore.getState().addToRoster(cls.id, contact);
        toast({ variant: 'success', title: `${contact.name} joined ${cls.name}` });
      },
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}
