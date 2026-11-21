-- Stream new class memberships so a teacher's roster updates live when a
-- student joins. RLS still limits each event to the class's teacher and the student.
alter publication supabase_realtime add table public.class_members;
