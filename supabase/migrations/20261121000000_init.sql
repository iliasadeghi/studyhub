-- StudyHub schema: profiles, classes, tasks, notes, events, office hours,
-- bookings and real-time messaging. Every table has Row Level Security.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('student', 'teacher');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null default '',
  full_name text not null default '' check (char_length(full_name) <= 80),
  role public.user_role not null default 'student',
  grade text,
  avatar_color text not null default 'purple',
  bio text not null default '' check (char_length(bio) <= 500),
  preferred_contact text not null default 'message'
    check (preferred_contact in ('email', 'message', 'in-person')),
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Role is chosen at sign-up and cannot be changed by the user afterwards.
create or replace function public.keep_role()
returns trigger language plpgsql as $$
begin
  new.role = old.role;
  new.email = old.email;
  return new;
end $$;

create trigger profiles_keep_role before update on public.profiles
  for each row execute function public.keep_role();

-- Create a profile row whenever someone signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  requested text := meta ->> 'role';
begin
  insert into public.profiles (id, email, full_name, role, grade)
  values (
    new.id,
    coalesce(new.email, ''),
    left(coalesce(meta ->> 'full_name', ''), 80),
    case when requested = 'teacher' then 'teacher'::public.user_role else 'student'::public.user_role end,
    nullif(meta ->> 'grade', '')
  );
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Classes and membership
-- ---------------------------------------------------------------------------
create table public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  subject text not null default '' check (char_length(subject) <= 60),
  color text not null default 'blue',
  room text not null default '' check (char_length(room) <= 40),
  schedule jsonb not null default '{"days": [1, 3, 5], "start": "09:00", "end": "09:50"}'::jsonb,
  join_code text not null unique
    default upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 6)),
  created_at timestamptz not null default now()
);
create index classes_teacher_idx on public.classes (teacher_id);

create table public.class_members (
  class_id uuid not null references public.classes (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (class_id, student_id)
);
create index class_members_student_idx on public.class_members (student_id);

-- Helper predicates. SECURITY DEFINER so policies can use them without
-- recursing into each other's RLS.
create or replace function public.is_teacher()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'teacher');
$$;

create or replace function public.is_class_teacher(cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from classes where id = cid and teacher_id = auth.uid());
$$;

create or replace function public.is_class_member(cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from class_members where class_id = cid and student_id = auth.uid());
$$;

-- True when the current user and 'other' are teacher/student in a shared class.
create or replace function public.shares_class(other uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from classes c join class_members m on m.class_id = c.id
    where (c.teacher_id = auth.uid() and m.student_id = other)
       or (c.teacher_id = other and m.student_id = auth.uid())
  );
$$;

-- ---------------------------------------------------------------------------
-- Messaging
-- ---------------------------------------------------------------------------
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (student_id, teacher_id)
);
create index conversations_teacher_idx on public.conversations (teacher_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 4000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index messages_conversation_idx on public.messages (conversation_id, created_at);

create or replace function public.is_conversation_participant(cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from conversations
    where id = cid and (student_id = auth.uid() or teacher_id = auth.uid())
  );
$$;

create or replace function public.has_conversation_with(other uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from conversations
    where (student_id = auth.uid() and teacher_id = other)
       or (teacher_id = auth.uid() and student_id = other)
  );
$$;

-- ---------------------------------------------------------------------------
-- Personal data: tasks, events, notes
-- ---------------------------------------------------------------------------
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  class_id uuid references public.classes (id) on delete set null,
  title text not null check (char_length(title) between 1 and 200),
  description text not null default '',
  type text not null default 'homework'
    check (type in ('homework', 'test', 'project', 'quiz', 'reading', 'personal')),
  due_at timestamptz not null,
  estimated_minutes integer not null default 30 check (estimated_minutes between 0 and 10000),
  importance text not null default 'medium' check (importance in ('low', 'medium', 'high')),
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  subtasks jsonb not null default '[]'::jsonb,
  links jsonb not null default '[]'::jsonb,
  quadrant_override text check (quadrant_override in ('do', 'schedule', 'delegate', 'eliminate')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tasks_owner_idx on public.tasks (owner_id, due_at);
create trigger tasks_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();

create table public.events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  class_id uuid references public.classes (id) on delete set null,
  kind text not null default 'event' check (kind in ('office-hours', 'study', 'event')),
  notes text not null default '',
  created_at timestamptz not null default now()
);
create index events_owner_idx on public.events (owner_id, starts_at);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  unit text not null default 'General',
  title text not null check (char_length(title) between 1 and 200),
  content text not null default '',
  visibility text not null default 'private' check (visibility in ('private', 'class')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index notes_class_idx on public.notes (class_id);
create trigger notes_updated_at before update on public.notes
  for each row execute function public.set_updated_at();

create table public.note_views (
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  note_id uuid not null references public.notes (id) on delete cascade,
  last_viewed timestamptz,
  bookmarked boolean not null default false,
  primary key (user_id, note_id)
);

-- ---------------------------------------------------------------------------
-- Office hours and bookings
-- ---------------------------------------------------------------------------
create table public.office_hours (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  day smallint not null check (day between 0 and 6),
  start_time time not null,
  end_time time not null check (end_time > start_time),
  location text not null default ''
);
create index office_hours_teacher_idx on public.office_hours (teacher_id);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  student_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  topic text not null default '',
  location text not null default '',
  status text not null default 'booked' check (status in ('booked', 'cancelled')),
  created_at timestamptz not null default now()
);
create index bookings_teacher_idx on public.bookings (teacher_id, starts_at);
create index bookings_student_idx on public.bookings (student_id, starts_at);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.class_members enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.tasks enable row level security;
alter table public.events enable row level security;
alter table public.notes enable row level security;
alter table public.note_views enable row level security;
alter table public.office_hours enable row level security;
alter table public.bookings enable row level security;

-- profiles: yourself, people you share a class with, people you've talked to.
create policy "profiles: read related" on public.profiles for select to authenticated
  using (id = auth.uid() or public.shares_class(id) or public.has_conversation_with(id));
create policy "profiles: update self" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- classes
create policy "classes: read as teacher or member" on public.classes for select to authenticated
  using (teacher_id = auth.uid() or public.is_class_member(id));
create policy "classes: teachers create" on public.classes for insert to authenticated
  with check (teacher_id = auth.uid() and public.is_teacher());
create policy "classes: teacher updates" on public.classes for update to authenticated
  using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());
create policy "classes: teacher deletes" on public.classes for delete to authenticated
  using (teacher_id = auth.uid());

-- class_members: insert only through join_class(); leave or be removed.
create policy "members: read own or own class" on public.class_members for select to authenticated
  using (student_id = auth.uid() or public.is_class_teacher(class_id));
create policy "members: leave or remove" on public.class_members for delete to authenticated
  using (student_id = auth.uid() or public.is_class_teacher(class_id));

-- conversations: participants only; created through get_or_create_conversation().
create policy "conversations: participants read" on public.conversations for select to authenticated
  using (student_id = auth.uid() or teacher_id = auth.uid());

-- messages
create policy "messages: participants read" on public.messages for select to authenticated
  using (public.is_conversation_participant(conversation_id));
create policy "messages: participants send as self" on public.messages for insert to authenticated
  with check (sender_id = auth.uid() and public.is_conversation_participant(conversation_id));

-- tasks / events: owner only
create policy "tasks: owner" on public.tasks for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "events: owner" on public.events for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- notes: private notes for the author; class notes for the class.
create policy "notes: read" on public.notes for select to authenticated
  using (
    author_id = auth.uid()
    or (visibility = 'class' and (public.is_class_member(class_id) or public.is_class_teacher(class_id)))
  );
create policy "notes: create" on public.notes for insert to authenticated
  with check (
    author_id = auth.uid() and (
      (visibility = 'private' and (public.is_class_member(class_id) or public.is_class_teacher(class_id)))
      or (visibility = 'class' and public.is_class_teacher(class_id))
    )
  );
create policy "notes: author updates" on public.notes for update to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid() and (visibility = 'private' or public.is_class_teacher(class_id)));
create policy "notes: author deletes" on public.notes for delete to authenticated
  using (author_id = auth.uid());

create policy "note_views: owner" on public.note_views for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- office hours: visible to the teacher's students.
create policy "office_hours: read" on public.office_hours for select to authenticated
  using (teacher_id = auth.uid() or public.shares_class(teacher_id));
create policy "office_hours: teacher writes" on public.office_hours for all to authenticated
  using (teacher_id = auth.uid()) with check (teacher_id = auth.uid() and public.is_teacher());

-- bookings
create policy "bookings: participants read" on public.bookings for select to authenticated
  using (student_id = auth.uid() or teacher_id = auth.uid());
create policy "bookings: student books own teacher" on public.bookings for insert to authenticated
  with check (student_id = auth.uid() and public.shares_class(teacher_id));
create policy "bookings: participants update" on public.bookings for update to authenticated
  using (student_id = auth.uid() or teacher_id = auth.uid())
  with check (student_id = auth.uid() or teacher_id = auth.uid());

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------
create or replace function public.join_class(code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  cid uuid;
begin
  if not exists (select 1 from profiles where id = auth.uid() and role = 'student') then
    raise exception 'Only students can join classes';
  end if;
  select id into cid from classes where join_code = upper(btrim(code));
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
  select role into me from profiles where id = auth.uid();
  if me = 'student' then sid := auth.uid(); tid := other;
  else sid := other; tid := auth.uid();
  end if;

  select id into cid from conversations where student_id = sid and teacher_id = tid;
  if cid is not null then
    return cid;
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
  if not public.is_conversation_participant(cid) then
    raise exception 'Not a participant';
  end if;
  update messages set read_at = now()
    where conversation_id = cid and sender_id <> auth.uid() and read_at is null;
end $$;

create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  delete from auth.users where id = auth.uid();
end $$;

revoke all on function public.join_class(text) from public, anon;
revoke all on function public.get_or_create_conversation(uuid) from public, anon;
revoke all on function public.mark_conversation_read(uuid) from public, anon;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.join_class(text) to authenticated;
grant execute on function public.get_or_create_conversation(uuid) to authenticated;
grant execute on function public.mark_conversation_read(uuid) to authenticated;
grant execute on function public.delete_my_account() to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime: stream new messages (and read receipts) to participants.
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.messages;
