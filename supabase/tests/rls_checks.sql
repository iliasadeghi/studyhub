-- Row Level Security checks. Paste into Supabase Studio → SQL Editor and Run.
-- Everything happens inside one transaction that is ROLLED BACK at the end,
-- so the fake users and rows below are never saved.
-- Success: the last result shows "ALL RLS CHECKS PASSED".
-- Failure: the run stops with an error message starting with "FAIL:".

begin;

-- ---------- Setup (as the database owner) ----------
insert into auth.users (id, email, raw_user_meta_data, aud, role) values
  ('00000000-0000-4000-8000-0000000000a1', 'rls-teacher@example.test', '{"full_name":"RLS Teacher","role":"teacher"}', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-0000000000a2', 'rls-student1@example.test', '{"full_name":"RLS Student One","role":"student","grade":"10"}', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-0000000000a3', 'rls-student2@example.test', '{"full_name":"RLS Student Two","role":"student","grade":"11"}', 'authenticated', 'authenticated');

insert into public.classes (id, teacher_id, name, join_code)
  values ('00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-0000000000a1', 'RLS Biology', 'RLS001');
insert into public.class_members (class_id, student_id)
  values ('00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-0000000000a2');
insert into public.tasks (owner_id, title, due_at) values
  ('00000000-0000-4000-8000-0000000000a2', 'Student one task', now()),
  ('00000000-0000-4000-8000-0000000000a3', 'Student two task', now());
insert into public.conversations (id, student_id, teacher_id)
  values ('00000000-0000-4000-8000-0000000000f1', '00000000-0000-4000-8000-0000000000a2', '00000000-0000-4000-8000-0000000000a1');
insert into public.messages (conversation_id, sender_id, body)
  values ('00000000-0000-4000-8000-0000000000f1', '00000000-0000-4000-8000-0000000000a2', 'Hi, a private question');
insert into public.notes (class_id, author_id, title, visibility) values
  ('00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-0000000000a1', 'Class note', 'class'),
  ('00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-0000000000a2', 'Student one private note', 'private');

do $$ begin
  if (select role from public.profiles where id = '00000000-0000-4000-8000-0000000000a1') <> 'teacher' then
    raise exception 'FAIL: sign-up trigger did not create a teacher profile';
  end if;
end $$;

-- ---------- Student two: not in the class ----------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a3","role":"authenticated"}', true);

do $$ begin
  if (select count(*) from public.tasks) <> 1 then raise exception 'FAIL: student can see another student''s tasks'; end if;
  if exists (select 1 from public.messages) then raise exception 'FAIL: non-participant can read messages'; end if;
  if exists (select 1 from public.conversations) then raise exception 'FAIL: non-participant can see a conversation'; end if;
  if exists (select 1 from public.classes) then raise exception 'FAIL: non-member can see a class'; end if;
  if exists (select 1 from public.notes) then raise exception 'FAIL: non-member can read class or private notes'; end if;
  if exists (select 1 from public.profiles where id <> auth.uid()) then raise exception 'FAIL: can see unrelated profiles'; end if;

  begin
    insert into public.class_members (class_id, student_id) values ('00000000-0000-4000-8000-0000000000c1', auth.uid());
    raise exception 'FAIL: joined a class without the code';
  exception when insufficient_privilege then null;
  end;

  begin
    insert into public.messages (conversation_id, sender_id, body)
      values ('00000000-0000-4000-8000-0000000000f1', auth.uid(), 'injected');
    raise exception 'FAIL: posted into someone else''s conversation';
  exception when insufficient_privilege then null;
  end;

  begin
    insert into public.classes (teacher_id, name) values (auth.uid(), 'Fake class');
    raise exception 'FAIL: a student created a class';
  exception when insufficient_privilege then null;
  end;

  begin
    perform public.get_or_create_conversation('00000000-0000-4000-8000-0000000000a1');
    raise exception 'FAIL: messaged a teacher without sharing a class';
  exception when raise_exception then
    if sqlerrm like 'FAIL:%' then raise; end if;
  end;

  begin
    perform public.join_class('WRONG1');
    raise exception 'FAIL: joined with a wrong code';
  exception when raise_exception then
    if sqlerrm like 'FAIL:%' then raise; end if;
  end;

  -- Role cannot be escalated after sign-up.
  update public.profiles set role = 'teacher' where id = auth.uid();
  if (select role from public.profiles where id = auth.uid()) <> 'student' then
    raise exception 'FAIL: a student changed their own role';
  end if;

  -- Joining with the right code works and reveals only class content.
  perform public.join_class('rls001');
  if (select count(*) from public.classes) <> 1 then raise exception 'FAIL: join_class did not add the student'; end if;
  if (select count(*) from public.notes) <> 1 then raise exception 'FAIL: member should see exactly the class note (not private notes)'; end if;
  if exists (select 1 from public.messages) then raise exception 'FAIL: joining a class exposed another student''s messages'; end if;
end $$;

-- ---------- Teacher ----------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);

do $$ begin
  if exists (select 1 from public.tasks) then raise exception 'FAIL: teacher can see student tasks'; end if;
  if (select count(*) from public.class_members) <> 2 then raise exception 'FAIL: teacher should see both students in the roster'; end if;
  if (select count(*) from public.messages) <> 1 then raise exception 'FAIL: teacher should see the conversation with their student'; end if;
  if exists (select 1 from public.notes where visibility = 'private') then raise exception 'FAIL: teacher can read a student''s private note'; end if;

  perform public.mark_conversation_read('00000000-0000-4000-8000-0000000000f1');
  if exists (select 1 from public.messages where read_at is null) then raise exception 'FAIL: mark_conversation_read did not mark the message read'; end if;

  begin
    insert into public.messages (conversation_id, sender_id, body)
      values ('00000000-0000-4000-8000-0000000000f1', '00000000-0000-4000-8000-0000000000a2', 'spoofed');
    raise exception 'FAIL: sent a message as someone else';
  exception when insufficient_privilege then null;
  end;
end $$;

reset role;
rollback;

-- Only reached if every check above passed.
select 'ALL RLS CHECKS PASSED' as result;
