-- Row Level Security checks. Paste into Supabase Studio → SQL Editor and Run.
-- Everything happens inside one transaction that is ROLLED BACK at the end,
-- so the fake users and rows below are never saved.
-- Success: the last result shows "ALL RLS CHECKS PASSED".
-- Failure: the run stops with an error message starting with "FAIL:".

begin;

-- ---------- Setup (as the database owner) ----------
-- Start from default school settings, and step any real admin aside, so the
-- checks below don't depend on this project's data (all rolled back).
update public.school_settings set signup_policy = 'open', allowed_domain = '', teacher_approval = true,
  features = '{"messaging": true, "student_start": true, "office_hours": true, "class_notes": true, "private_notes": true}';
select set_config('app.admin_change', 'on', true);
update public.profiles set role = 'teacher' where role = 'admin';
select set_config('app.admin_change', 'off', true);

insert into auth.users (id, email, raw_user_meta_data, aud, role) values
  ('00000000-0000-4000-8000-0000000000a1', 'rls-teacher@example.test', '{"full_name":"RLS Teacher","role":"teacher"}', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-0000000000a2', 'rls-student1@example.test', '{"full_name":"RLS Student One","role":"student","grade":"10"}', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-0000000000a3', 'rls-student2@example.test', '{"full_name":"RLS Student Two","role":"student","grade":"11"}', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-0000000000a4', 'rls-admin@example.test', '{"full_name":"RLS Admin","role":"admin"}', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-0000000000a5', 'rls-newteacher@example.test', '{"full_name":"RLS New Teacher","role":"teacher"}', 'authenticated', 'authenticated');

do $$ begin
  if (select role from public.profiles where id = '00000000-0000-4000-8000-0000000000a4') <> 'student' then
    raise exception 'FAIL: someone signed up as admin';
  end if;
  if (select status from public.profiles where id = '00000000-0000-4000-8000-0000000000a5') <> 'pending' then
    raise exception 'FAIL: a new teacher was not left pending approval';
  end if;
end $$;

-- Approve the first teacher and promote one admin (the same path used to set up the real admin).
select set_config('app.admin_change', 'on', true);
update public.profiles set status = 'active' where id = '00000000-0000-4000-8000-0000000000a1';
update public.profiles set role = 'admin', onboarded = true where id = '00000000-0000-4000-8000-0000000000a4';
do $$ begin
  begin
    update public.profiles set role = 'admin' where id = '00000000-0000-4000-8000-0000000000a3';
    raise exception 'FAIL: a second admin was allowed';
  exception when unique_violation then null;
  end;
end $$;
select set_config('app.admin_change', 'off', true);

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

-- ---------- Admin ----------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a4","role":"authenticated"}', true);

do $$ begin
  if (select count(*) from public.profiles where email like 'rls-%') <> 5 then raise exception 'FAIL: admin should see every account'; end if;
  if not exists (select 1 from public.classes where id = '00000000-0000-4000-8000-0000000000c1') then raise exception 'FAIL: admin should see every class'; end if;
  if (select count(*) from public.class_members where class_id = '00000000-0000-4000-8000-0000000000c1') <> 2 then raise exception 'FAIL: admin should see rosters'; end if;
  if exists (select 1 from public.messages) then raise exception 'FAIL: admin read messages without the logged view'; end if;
  if exists (select 1 from public.tasks) then raise exception 'FAIL: admin can read students'' private tasks'; end if;
  if exists (select 1 from public.notes where visibility = 'private') then raise exception 'FAIL: admin can read private notes'; end if;

  if (select count(*) from public.admin_view_conversation('00000000-0000-4000-8000-0000000000f1')) <> 1 then
    raise exception 'FAIL: admin_view_conversation did not return the conversation';
  end if;
  if not exists (select 1 from public.audit_log where action = 'conversation.viewed' and target_id = '00000000-0000-4000-8000-0000000000f1') then
    raise exception 'FAIL: viewing a conversation was not logged';
  end if;

  if (public.admin_stats() ->> 'pending')::int < 1 then raise exception 'FAIL: admin_stats missed the pending teacher'; end if;
  if (select count(*) from public.admin_list_users() u where u.email like 'rls-%') <> 5 then raise exception 'FAIL: admin_list_users incomplete'; end if;

  -- Role/status can't be changed by a plain update, even by the admin.
  update public.profiles set status = 'suspended' where id = '00000000-0000-4000-8000-0000000000a3';
  if (select status from public.profiles where id = '00000000-0000-4000-8000-0000000000a3') <> 'active' then
    raise exception 'FAIL: status changed without the admin RPC';
  end if;

  begin
    perform public.admin_set_status(auth.uid(), 'suspended');
    raise exception 'FAIL: admin suspended their own account';
  exception when raise_exception then
    if sqlerrm like 'FAIL:%' then raise; end if;
  end;

  perform public.admin_set_status('00000000-0000-4000-8000-0000000000a2', 'suspended');
  perform public.admin_update_settings('{"features": {"messaging": false, "office_hours": false}}');
  if (select count(*) from public.audit_log where action in ('user.suspended', 'settings.updated')) < 2 then
    raise exception 'FAIL: admin actions were not logged';
  end if;
end $$;

-- ---------- Suspended student ----------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a2","role":"authenticated"}', true);

do $$ begin
  if exists (select 1 from public.tasks) then raise exception 'FAIL: suspended user can read their data'; end if;
  if exists (select 1 from public.classes) then raise exception 'FAIL: suspended user can see classes'; end if;
  if (select count(*) from public.profiles) <> 1 then raise exception 'FAIL: suspended user should see only their own profile'; end if;
  begin
    insert into public.tasks (title, due_at) values ('sneaky', now());
    raise exception 'FAIL: suspended user created a task';
  exception when insufficient_privilege then null;
  end;
end $$;

-- ---------- Pending teacher ----------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a5","role":"authenticated"}', true);

do $$ begin
  if (select count(*) from public.profiles) <> 1 then raise exception 'FAIL: pending teacher can see other accounts'; end if;
  begin
    insert into public.classes (teacher_id, name) values (auth.uid(), 'Unapproved class');
    raise exception 'FAIL: a pending teacher created a class';
  exception when insufficient_privilege then null;
  end;
end $$;

-- ---------- Active student: admin-only features and switches ----------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a3","role":"authenticated"}', true);

do $$ begin
  if exists (select 1 from public.audit_log) then raise exception 'FAIL: a student can read the audit log'; end if;
  begin
    perform public.admin_set_status('00000000-0000-4000-8000-0000000000a5', 'active');
    raise exception 'FAIL: a student approved a teacher';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.admin_view_conversation('00000000-0000-4000-8000-0000000000f1');
    raise exception 'FAIL: a student used the admin conversation view';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.get_or_create_conversation('00000000-0000-4000-8000-0000000000a1');
    raise exception 'FAIL: messaging switch did not block a new conversation';
  exception when raise_exception then
    if sqlerrm like 'FAIL:%' then raise; end if;
  end;
  begin
    insert into public.bookings (teacher_id, starts_at, ends_at)
      values ('00000000-0000-4000-8000-0000000000a1', now() + interval '1 day', now() + interval '1 day 15 minutes');
    raise exception 'FAIL: office-hours switch did not block a booking';
  exception when insufficient_privilege then null;
  end;
end $$;

-- ---------- Admin archives the class; it disappears for its members ----------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a4","role":"authenticated"}', true);
select public.admin_archive_class('00000000-0000-4000-8000-0000000000c1', true);
select public.admin_update_settings('{"signup_policy": "domain", "allowed_domain": "@School.test"}');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a3","role":"authenticated"}', true);
do $$ begin
  if exists (select 1 from public.classes) then raise exception 'FAIL: archived class is still visible to members'; end if;
  begin
    perform public.join_class('RLS001');
    raise exception 'FAIL: joined an archived class';
  exception when raise_exception then
    if sqlerrm like 'FAIL:%' then raise; end if;
  end;
end $$;

-- ---------- Sign-up policy is enforced by the database ----------
reset role;
do $$ begin
  begin
    insert into auth.users (id, email, raw_user_meta_data, aud, role) values
      ('00000000-0000-4000-8000-0000000000a6', 'outsider@example.test', '{}', 'authenticated', 'authenticated');
    raise exception 'FAIL: sign-up from outside the school domain was allowed';
  exception when raise_exception then
    if sqlerrm like 'FAIL:%' then raise; end if;
  end;
  insert into auth.users (id, email, raw_user_meta_data, aud, role) values
    ('00000000-0000-4000-8000-0000000000a7', 'insider@school.test', '{}', 'authenticated', 'authenticated');
  if not exists (select 1 from public.profiles where id = '00000000-0000-4000-8000-0000000000a7') then
    raise exception 'FAIL: school-domain sign-up did not create a profile';
  end if;
end $$;

rollback;

-- Only reached if every check above passed.
select 'ALL RLS CHECKS PASSED' as result;
