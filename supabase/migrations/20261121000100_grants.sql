-- Table privileges for signed-in users. Newer Supabase projects don't grant
-- these automatically; RLS policies still decide which rows each user can reach.
-- Logged-out visitors (anon) get no table access at all.

grant usage on schema public to authenticated;

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.classes to authenticated;
grant select, delete on public.class_members to authenticated;
grant select on public.conversations to authenticated;
grant select, insert on public.messages to authenticated;
grant select, insert, update, delete on public.tasks to authenticated;
grant select, insert, update, delete on public.events to authenticated;
grant select, insert, update, delete on public.notes to authenticated;
grant select, insert, update, delete on public.note_views to authenticated;
grant select, insert, update, delete on public.office_hours to authenticated;
grant select, insert, update on public.bookings to authenticated;

revoke all on all tables in schema public from anon;
