-- School admin: one admin account, account status (pending / suspended /
-- archived), class archiving, school-wide settings and feature switches,
-- an append-only audit log, and admin-only RPCs. Run after 20261122000000.

-- ---------------------------------------------------------------------------
-- Account status
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column status text not null default 'active'
    check (status in ('active', 'pending', 'suspended')),
  add column archived_at timestamptz,
  add constraint profiles_admin_always_active
    check (role <> 'admin' or (status = 'active' and archived_at is null));

-- There is only ever one admin.
create unique index profiles_single_admin on public.profiles (role) where role = 'admin';

alter table public.classes add column archived_at timestamptz;

-- ---------------------------------------------------------------------------
-- School settings (a single row)
-- ---------------------------------------------------------------------------
create table public.school_settings (
  id smallint primary key default 1 check (id = 1),
  school_name text not null default 'StudyHub' check (char_length(btrim(school_name)) between 1 and 60),
  announcement text not null default '' check (char_length(announcement) <= 280),
  announcement_tone text not null default 'info'
    check (announcement_tone in ('info', 'success', 'warning', 'danger')),
  announcement_at timestamptz,
  accent text not null default 'indigo' check (accent in ('indigo', 'teal', 'rose', 'amber', 'sky')),
  signup_policy text not null default 'open' check (signup_policy in ('open', 'domain', 'closed')),
  allowed_domain text not null default '' check (char_length(allowed_domain) <= 100),
  teacher_approval boolean not null default true,
  features jsonb not null default
    '{"messaging": true, "student_start": true, "office_hours": true, "class_notes": true, "private_notes": true}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);
insert into public.school_settings default values;

-- ---------------------------------------------------------------------------
-- Audit log (written only by the admin RPCs below; never updated or deleted)
-- ---------------------------------------------------------------------------
create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  target_type text not null default '',
  target_id text,
  target_label text not null default '',
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_log_created_idx on public.audit_log (created_at desc);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- Approved, not suspended and not archived.
create or replace function public.is_active()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles where id = auth.uid() and status = 'active' and archived_at is null
  );
$$;

-- School feature switch; unknown switches count as on.
create or replace function public.feature(name text)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select (features ->> name)::boolean from school_settings where id = 1), true);
$$;

create or replace function public.assert_admin()
returns void language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Only the school admin can do that' using errcode = '42501';
  end if;
end $$;

create or replace function public.log_admin(
  act text, ttype text, tid text, tlabel text, extra jsonb default '{}'::jsonb
)
returns void language sql security definer set search_path = public as $$
  insert into audit_log (actor_id, action, target_type, target_id, target_label, details)
  values (auth.uid(), act, ttype, tid, coalesce(tlabel, ''), coalesce(extra, '{}'::jsonb));
$$;

create or replace function public.person_label(uid uuid)
returns text language sql stable security definer set search_path = public as $$
  select coalesce(nullif(full_name, ''), email, 'Unknown user') from profiles where id = uid;
$$;

-- Role, status and archive state change only through the admin RPCs, which
-- set app.admin_change for the length of their transaction.
create or replace function public.keep_role()
returns trigger language plpgsql as $$
begin
  if coalesce(current_setting('app.admin_change', true), 'off') <> 'on'
     or (auth.uid() is not null and not public.is_admin()) then
    new.role = old.role;
    new.status = old.status;
    new.archived_at = old.archived_at;
  end if;
  new.email = old.email;
  return new;
end $$;

-- Sign-up: apply the school's sign-up policy; teachers may need approval;
-- nobody can ever sign up as admin.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  requested text := meta ->> 'role';
  s school_settings;
  domain text := lower(split_part(coalesce(new.email, ''), '@', 2));
begin
  select * into s from school_settings where id = 1;
  if s.signup_policy = 'closed' then
    raise exception 'Sign-ups are closed. Ask your school admin for access.';
  end if;
  if s.signup_policy = 'domain' and s.allowed_domain <> '' and domain <> s.allowed_domain then
    raise exception 'Use your school email address (@%) to sign up.', s.allowed_domain;
  end if;

  insert into public.profiles (id, email, full_name, role, grade, status)
  values (
    new.id,
    coalesce(new.email, ''),
    left(coalesce(meta ->> 'full_name', ''), 80),
    case when requested = 'teacher' then 'teacher'::public.user_role else 'student'::public.user_role end,
    nullif(meta ->> 'grade', ''),
    case when requested = 'teacher' and coalesce(s.teacher_approval, true) then 'pending' else 'active' end
  );
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.school_settings enable row level security;
alter table public.audit_log enable row level security;

create policy "settings: signed-in users read" on public.school_settings for select to authenticated
  using (true);
create policy "audit: admin reads" on public.audit_log for select to authenticated
  using ((select public.is_admin()));

-- Pending, suspended and archived accounts can't read or change anything
-- except their own profile row (so the app can show them why).
create policy "profiles: active users only (read)" on public.profiles as restrictive
  for select to authenticated using ((select public.is_active()) or id = auth.uid());
create policy "profiles: active users only (write)" on public.profiles as restrictive
  for update to authenticated using ((select public.is_active())) with check ((select public.is_active()));

do $$
declare t text;
begin
  foreach t in array array['classes', 'class_members', 'conversations', 'messages', 'tasks',
                           'events', 'notes', 'note_views', 'office_hours', 'bookings'] loop
    execute format(
      'create policy "active users only" on public.%I as restrictive for all to authenticated
         using ((select public.is_active())) with check ((select public.is_active()))', t);
  end loop;
end $$;

-- Archived classes disappear for everyone but the admin and can't be edited.
create policy "classes: hide archived" on public.classes as restrictive for select to authenticated
  using (archived_at is null or (select public.is_admin()));
create policy "classes: archived are read-only" on public.classes as restrictive for update to authenticated
  using (archived_at is null);
create policy "classes: archived can't be deleted by teachers" on public.classes as restrictive
  for delete to authenticated using (archived_at is null);

-- Feature switches (existing content stays readable; new activity is blocked).
create policy "messages: messaging enabled" on public.messages as restrictive for insert to authenticated
  with check ((select public.feature('messaging')));
create policy "bookings: office hours enabled" on public.bookings as restrictive for insert to authenticated
  with check ((select public.feature('office_hours')));
create policy "notes: feature enabled (insert)" on public.notes as restrictive for insert to authenticated
  with check (case when visibility = 'class' then public.feature('class_notes') else public.feature('private_notes') end);
create policy "notes: feature enabled (update)" on public.notes as restrictive for update to authenticated
  with check (case when visibility = 'class' then public.feature('class_notes') else public.feature('private_notes') end);

-- The admin can read every account, class, roster, conversation list, class
-- note, office hour and booking. Messages are NOT readable directly: only
-- through admin_view_conversation(), which records every view.
create policy "profiles: admin reads" on public.profiles for select to authenticated
  using ((select public.is_admin()));
create policy "classes: admin reads" on public.classes for select to authenticated
  using ((select public.is_admin()));
create policy "members: admin reads" on public.class_members for select to authenticated
  using ((select public.is_admin()));
create policy "conversations: admin reads" on public.conversations for select to authenticated
  using ((select public.is_admin()));
create policy "notes: admin reads class notes" on public.notes for select to authenticated
  using (visibility = 'class' and (select public.is_admin()));
create policy "office_hours: admin reads" on public.office_hours for select to authenticated
  using ((select public.is_admin()));
create policy "bookings: admin reads" on public.bookings for select to authenticated
  using ((select public.is_admin()));

grant select on public.school_settings to authenticated;
grant select on public.audit_log to authenticated;

-- ---------------------------------------------------------------------------
-- Existing RPCs: respect account status, archived classes and feature switches
-- ---------------------------------------------------------------------------
create or replace function public.join_class(code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  cid uuid;
begin
  if not exists (
    select 1 from profiles
    where id = auth.uid() and role = 'student' and status = 'active' and archived_at is null
  ) then
    raise exception 'Only active student accounts can join classes';
  end if;
  select id into cid from classes where join_code = upper(btrim(code)) and archived_at is null;
  if cid is null then
    raise exception 'No class found with that code';
  end if;
  insert into class_members (class_id, student_id) values (cid, auth.uid())
    on conflict do nothing;
  return cid;
end $$;

create or replace function public.get_or_create_conversation(other uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  me public.user_role;
  sid uuid;
  tid uuid;
  cid uuid;
begin
  if not public.is_active() then
    raise exception 'Your account is not active';
  end if;
  if not public.feature('messaging') then
    raise exception 'Messaging is turned off by your school';
  end if;
  select role into me from profiles where id = auth.uid();
  if me = 'student' then sid := auth.uid(); tid := other;
  elsif me = 'teacher' then sid := other; tid := auth.uid();
  else raise exception 'Only students and teachers can message each other';
  end if;

  select id into cid from conversations where student_id = sid and teacher_id = tid;
  if cid is not null then
    return cid;
  end if;

  if me = 'student' and not public.feature('student_start') then
    raise exception 'Students can''t start new conversations right now';
  end if;
  if not public.shares_class(other) then
    raise exception 'You can only message people in your classes';
  end if;

  insert into conversations (student_id, teacher_id) values (sid, tid) returning id into cid;
  return cid;
end $$;

create or replace function public.mark_conversation_read(cid uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_active() or not public.is_conversation_participant(cid) then
    raise exception 'Not a participant';
  end if;
  update messages set read_at = now()
    where conversation_id = cid and sender_id <> auth.uid() and read_at is null;
end $$;

create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  if public.is_admin() then
    raise exception 'The school admin account can''t be deleted from the app';
  end if;
  delete from auth.users where id = auth.uid();
end $$;

-- ---------------------------------------------------------------------------
-- Public settings for the login and sign-up pages (no secrets)
-- ---------------------------------------------------------------------------
create or replace function public.get_public_settings()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'school_name', school_name,
    'accent', accent,
    'signup_policy', signup_policy,
    'allowed_domain', allowed_domain,
    'teacher_approval', teacher_approval
  ) from school_settings where id = 1;
$$;

-- ---------------------------------------------------------------------------
-- Admin: read-only views
-- ---------------------------------------------------------------------------
create or replace function public.admin_stats()
returns jsonb language plpgsql stable security definer set search_path = public, auth as $$
declare result jsonb;
begin
  perform public.assert_admin();
  select jsonb_build_object(
    'students', (select count(*) from profiles where role = 'student' and archived_at is null),
    'teachers', (select count(*) from profiles where role = 'teacher' and archived_at is null),
    'pending', (select count(*) from profiles where status = 'pending' and archived_at is null),
    'suspended', (select count(*) from profiles where status = 'suspended' and archived_at is null),
    'archived_users', (select count(*) from profiles where archived_at is not null),
    'classes', (select count(*) from classes where archived_at is null),
    'archived_classes', (select count(*) from classes where archived_at is not null),
    'messages_week', (select count(*) from messages where created_at > now() - interval '7 days'),
    'signups_week', (select count(*) from profiles where created_at > now() - interval '7 days'),
    'active_week', (select count(*) from auth.users where last_sign_in_at > now() - interval '7 days')
  ) into result;
  return result;
end $$;

create or replace function public.admin_list_users()
returns table (
  id uuid, email text, full_name text, role public.user_role, status text, grade text,
  avatar_color text, created_at timestamptz, archived_at timestamptz,
  last_sign_in_at timestamptz, email_confirmed boolean, class_count integer
)
language plpgsql stable security definer set search_path = public, auth as $$
#variable_conflict use_column
begin
  perform public.assert_admin();
  return query
  select p.id, p.email, p.full_name, p.role, p.status, p.grade, p.avatar_color, p.created_at,
         p.archived_at, u.last_sign_in_at, u.email_confirmed_at is not null,
         ((select count(*) from classes c where c.teacher_id = p.id)
          + (select count(*) from class_members m where m.student_id = p.id))::integer
  from profiles p left join auth.users u on u.id = p.id
  order by p.created_at desc;
end $$;

-- Counts only: the admin never sees a student's private tasks or notes.
create or replace function public.admin_user_detail(target uuid)
returns jsonb language plpgsql stable security definer set search_path = public, auth as $$
declare result jsonb;
begin
  perform public.assert_admin();
  select jsonb_build_object(
    'teaches', coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name, 'archived', c.archived_at is not null) order by c.name)
                         from classes c where c.teacher_id = target), '[]'::jsonb),
    'enrolled', coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name, 'archived', c.archived_at is not null) order by c.name)
                          from class_members m join classes c on c.id = m.class_id where m.student_id = target), '[]'::jsonb),
    'tasks', (select count(*) from tasks where owner_id = target),
    'tasks_done', (select count(*) from tasks where owner_id = target and status = 'done'),
    'conversations', (select count(*) from conversations where student_id = target or teacher_id = target),
    'messages_sent', (select count(*) from messages where sender_id = target),
    'bookings', (select count(*) from bookings where student_id = target or teacher_id = target),
    'last_sign_in_at', (select last_sign_in_at from auth.users where id = target)
  ) into result;
  return result;
end $$;

create or replace function public.admin_list_classes()
returns table (
  id uuid, name text, subject text, color text, room text, schedule jsonb, join_code text,
  teacher_id uuid, teacher_name text, student_count integer, created_at timestamptz,
  archived_at timestamptz
)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  perform public.assert_admin();
  return query
  select c.id, c.name, c.subject, c.color, c.room, c.schedule, c.join_code, c.teacher_id,
         public.person_label(c.teacher_id),
         (select count(*) from class_members m where m.class_id = c.id)::integer,
         c.created_at, c.archived_at
  from classes c
  order by c.archived_at nulls first, c.name;
end $$;

-- Who talks to whom and when. No message text.
create or replace function public.admin_list_conversations()
returns table (
  id uuid, student_id uuid, student_name text, teacher_id uuid, teacher_name text,
  message_count integer, last_message_at timestamptz
)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  perform public.assert_admin();
  return query
  select v.id, v.student_id, public.person_label(v.student_id), v.teacher_id,
         public.person_label(v.teacher_id),
         (select count(*) from messages m where m.conversation_id = v.id)::integer,
         (select max(m.created_at) from messages m where m.conversation_id = v.id)
  from conversations v
  order by 7 desc nulls last;
end $$;

-- Read-only view of one conversation. Every call is recorded in the audit log.
create or replace function public.admin_view_conversation(cid uuid)
returns setof public.messages
language plpgsql security definer set search_path = public as $$
declare v conversations;
begin
  perform public.assert_admin();
  select * into v from conversations where id = cid;
  if not found then
    raise exception 'Conversation not found';
  end if;
  perform public.log_admin('conversation.viewed', 'conversation', cid::text,
    public.person_label(v.student_id) || ' ↔ ' || public.person_label(v.teacher_id));
  return query select * from messages where conversation_id = cid order by created_at;
end $$;

-- ---------------------------------------------------------------------------
-- Admin: user management
-- ---------------------------------------------------------------------------
create or replace function public.admin_target(target uuid)
returns public.profiles language plpgsql stable security definer set search_path = public as $$
declare p profiles;
begin
  perform public.assert_admin();
  select * into p from profiles where id = target;
  if not found then
    raise exception 'User not found';
  end if;
  if p.id = auth.uid() or p.role = 'admin' then
    raise exception 'The admin account can''t be changed here';
  end if;
  return p;
end $$;

create or replace function public.admin_set_status(target uuid, new_status text)
returns void language plpgsql security definer set search_path = public as $$
declare p profiles := public.admin_target(target);
begin
  if new_status not in ('active', 'pending', 'suspended') then
    raise exception 'Unknown status: %', new_status;
  end if;
  perform set_config('app.admin_change', 'on', true);
  update profiles set status = new_status where id = target;
  perform set_config('app.admin_change', 'off', true);
  perform public.log_admin(
    case when p.status = 'pending' and new_status = 'active' then 'user.approved'
         when new_status = 'suspended' then 'user.suspended'
         when new_status = 'active' then 'user.reactivated'
         else 'user.status_changed' end,
    'user', target::text, public.person_label(target),
    jsonb_build_object('from', p.status, 'to', new_status));
end $$;

create or replace function public.admin_set_role(target uuid, new_role text)
returns void language plpgsql security definer set search_path = public as $$
declare p profiles := public.admin_target(target);
begin
  if new_role not in ('student', 'teacher') then
    raise exception 'Role must be student or teacher';
  end if;
  if p.role::text = new_role then
    return;
  end if;
  if new_role = 'student' and exists (select 1 from classes where teacher_id = target) then
    raise exception 'Reassign or delete this teacher''s classes first';
  end if;
  if new_role = 'teacher' then
    delete from class_members where student_id = target;
  end if;
  perform set_config('app.admin_change', 'on', true);
  update profiles set role = new_role::public.user_role where id = target;
  perform set_config('app.admin_change', 'off', true);
  perform public.log_admin('user.role_changed', 'user', target::text, public.person_label(target),
    jsonb_build_object('from', p.role, 'to', new_role));
end $$;

create or replace function public.admin_archive_user(target uuid, archive boolean)
returns void language plpgsql security definer set search_path = public as $$
declare p profiles := public.admin_target(target);
begin
  perform set_config('app.admin_change', 'on', true);
  update profiles set archived_at = case when archive then now() else null end where id = target;
  perform set_config('app.admin_change', 'off', true);
  perform public.log_admin(case when archive then 'user.archived' else 'user.restored' end,
    'user', target::text, public.person_label(target));
end $$;

-- Permanently delete an archived account and everything it owns.
create or replace function public.admin_delete_user(target uuid)
returns void language plpgsql security definer set search_path = public, auth as $$
declare p profiles := public.admin_target(target);
begin
  if p.archived_at is null then
    raise exception 'Archive the account before deleting it';
  end if;
  if exists (select 1 from classes where teacher_id = target) then
    raise exception 'Reassign or delete this teacher''s classes first';
  end if;
  perform public.log_admin('user.deleted', 'user', target::text, public.person_label(target),
    jsonb_build_object('email', p.email, 'role', p.role));
  delete from auth.users where id = target;
end $$;

-- Lets the admin record actions done through Supabase Auth from the app
-- (sending a password-reset email).
create or replace function public.admin_record(act text, target uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.admin_target(target);
  if act not in ('user.password_reset_sent') then
    raise exception 'Unknown action';
  end if;
  perform public.log_admin(act, 'user', target::text, public.person_label(target));
end $$;

-- ---------------------------------------------------------------------------
-- Admin: classes
-- ---------------------------------------------------------------------------
create or replace function public.admin_class(cid uuid)
returns public.classes language plpgsql stable security definer set search_path = public as $$
declare c classes;
begin
  perform public.assert_admin();
  select * into c from classes where id = cid;
  if not found then
    raise exception 'Class not found';
  end if;
  return c;
end $$;

create or replace function public.admin_archive_class(cid uuid, archive boolean)
returns void language plpgsql security definer set search_path = public as $$
declare c classes := public.admin_class(cid);
begin
  update classes set archived_at = case when archive then now() else null end where id = cid;
  perform public.log_admin(case when archive then 'class.archived' else 'class.restored' end,
    'class', cid::text, c.name);
end $$;

create or replace function public.admin_delete_class(cid uuid)
returns void language plpgsql security definer set search_path = public as $$
declare c classes := public.admin_class(cid);
begin
  if c.archived_at is null then
    raise exception 'Archive the class before deleting it';
  end if;
  perform public.log_admin('class.deleted', 'class', cid::text, c.name,
    jsonb_build_object('teacher', public.person_label(c.teacher_id)));
  delete from classes where id = cid;
end $$;

create or replace function public.admin_reassign_class(cid uuid, new_teacher uuid)
returns void language plpgsql security definer set search_path = public as $$
declare c classes := public.admin_class(cid);
begin
  if not exists (
    select 1 from profiles where id = new_teacher and role = 'teacher' and archived_at is null
  ) then
    raise exception 'Pick a teacher account';
  end if;
  delete from class_members where class_id = cid and student_id = new_teacher;
  update classes set teacher_id = new_teacher where id = cid;
  perform public.log_admin('class.reassigned', 'class', cid::text, c.name,
    jsonb_build_object('from', public.person_label(c.teacher_id), 'to', public.person_label(new_teacher)));
end $$;

create or replace function public.admin_set_member(cid uuid, student uuid, enrolled boolean)
returns void language plpgsql security definer set search_path = public as $$
declare c classes := public.admin_class(cid);
begin
  if enrolled then
    if not exists (select 1 from profiles where id = student and role = 'student') then
      raise exception 'Only students can be added to a class';
    end if;
    insert into class_members (class_id, student_id) values (cid, student) on conflict do nothing;
  else
    delete from class_members where class_id = cid and student_id = student;
  end if;
  perform public.log_admin(case when enrolled then 'class.member_added' else 'class.member_removed' end,
    'class', cid::text, c.name, jsonb_build_object('student', public.person_label(student)));
end $$;

create or replace function public.admin_rotate_join_code(cid uuid)
returns text language plpgsql security definer set search_path = public as $$
declare
  c classes := public.admin_class(cid);
  code text := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
begin
  update classes set join_code = code where id = cid;
  perform public.log_admin('class.code_rotated', 'class', cid::text, c.name);
  return code;
end $$;

-- ---------------------------------------------------------------------------
-- Admin: school settings
-- ---------------------------------------------------------------------------
create or replace function public.admin_update_settings(patch jsonb)
returns public.school_settings language plpgsql security definer set search_path = public as $$
declare
  s school_settings;
  clean_features jsonb := coalesce((
    select jsonb_object_agg(key, value) from jsonb_each(coalesce(patch -> 'features', '{}'::jsonb))
    where key in ('messaging', 'student_start', 'office_hours', 'class_notes', 'private_notes')
      and jsonb_typeof(value) = 'boolean'
  ), '{}'::jsonb);
begin
  perform public.assert_admin();
  update school_settings set
    school_name = coalesce(btrim(patch ->> 'school_name'), school_name),
    announcement = coalesce(btrim(patch ->> 'announcement'), announcement),
    announcement_at = case
      when patch ? 'announcement' and btrim(patch ->> 'announcement') is distinct from announcement
      then now() else announcement_at end,
    announcement_tone = coalesce(patch ->> 'announcement_tone', announcement_tone),
    accent = coalesce(patch ->> 'accent', accent),
    signup_policy = coalesce(patch ->> 'signup_policy', signup_policy),
    allowed_domain = coalesce(ltrim(lower(btrim(patch ->> 'allowed_domain')), '@'), allowed_domain),
    teacher_approval = coalesce((patch ->> 'teacher_approval')::boolean, teacher_approval),
    features = features || clean_features,
    updated_at = now(),
    updated_by = auth.uid()
  where id = 1
  returning * into s;
  if s.signup_policy = 'domain' and s.allowed_domain = '' then
    raise exception 'Enter the school email domain to limit sign-ups';
  end if;
  perform public.log_admin('settings.updated', 'settings', '1', s.school_name, patch);
  return s;
end $$;

-- ---------------------------------------------------------------------------
-- Function privileges
-- ---------------------------------------------------------------------------
do $$
declare f text;
begin
  -- Internal helpers: not callable through the API at all.
  foreach f in array array['public.log_admin(text, text, text, text, jsonb)',
                           'public.admin_target(uuid)', 'public.admin_class(uuid)'] loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
  end loop;
  -- Signed-in only (each admin_* checks is_admin() itself).
  foreach f in array array[
    'public.is_admin()', 'public.is_active()', 'public.feature(text)', 'public.assert_admin()',
    'public.person_label(uuid)', 'public.admin_stats()', 'public.admin_list_users()',
    'public.admin_user_detail(uuid)', 'public.admin_list_classes()',
    'public.admin_list_conversations()', 'public.admin_view_conversation(uuid)',
    'public.admin_set_status(uuid, text)', 'public.admin_set_role(uuid, text)',
    'public.admin_archive_user(uuid, boolean)', 'public.admin_delete_user(uuid)',
    'public.admin_record(text, uuid)', 'public.admin_archive_class(uuid, boolean)',
    'public.admin_delete_class(uuid)', 'public.admin_reassign_class(uuid, uuid)',
    'public.admin_set_member(uuid, uuid, boolean)', 'public.admin_rotate_join_code(uuid)',
    'public.admin_update_settings(jsonb)'] loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;

-- Logged-out visitors may read the public school name and sign-up policy.
revoke all on function public.get_public_settings() from public;
grant execute on function public.get_public_settings() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Realtime: live announcements / feature switches, and live approval or
-- suspension of the signed-in user's own account.
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.school_settings;
alter publication supabase_realtime add table public.profiles;
