-- Adds the 'admin' role. Postgres requires a new enum value to be committed
-- before it can be used, so this runs on its own before 20261122000100_admin.sql.
alter type public.user_role add value if not exists 'admin';
