# StudyHub 🎓

A calm, modern organizer for high school students and their teachers. Students track assignments, see what to do first, read class notes and message their teachers in real time. Teachers run classes, share notes, hold office hours and answer students.

**Live:** https://studyhub-iota-seven.vercel.app

**Stack:** React 18 + TypeScript + Vite frontend on **Vercel**, with **Supabase** for Postgres, Auth, Row Level Security and Realtime.

---

## Features

| Area             | Highlights                                                                                                                                                                                                              |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Accounts**     | Email/password and magic-link sign-in. Sign up as a **student** or **teacher**. Email confirmation, password reset, change password, delete account                                                                     |
| **Dashboards**   | **Students:** Focus Now (top 3 by priority score), today and next 7 days, weekly progress ring, streak, workload by class. **Teachers:** classes with join codes, student counts, unread messages, office-hour bookings |
| **Classes**      | Teachers create classes and share a 6-character **join code**; students join with it. Roster management, subject artwork, leave/remove                                                                                  |
| **Messaging**    | Real-time student↔teacher chat. Inbox with unread badges, "typing…" indicator, online presence, Delivered/Seen receipts, message templates, toasts for new messages                                                     |
| **Tasks**        | Personal tasks with subtasks and links. List / Kanban / Eisenhower matrix views with drag-and-drop. Smart priority score (deadline, importance, type, effort)                                                           |
| **Calendar**     | Month/week views, drag to reschedule, study-plan suggestions, office-hour bookings                                                                                                                                      |
| **Notes**        | Teachers publish **class notes**; everyone keeps **private notes**. Markdown editor with live preview, search, bookmarks, table of contents, print styles                                                               |
| **Office hours** | Teachers set weekly windows; students book 15-minute slots that show on both calendars                                                                                                                                  |
| **Global**       | Command palette (`Ctrl/⌘ K`), keyboard shortcuts (`?`), light/dark themes with a circular reveal, accent colors, fully responsive, accessible                                                                           |

## Architecture

```
Browser (React SPA on Vercel)
  └─ supabase-js (public publishable key only)
       ├─ Auth        email + password / magic link, confirmation and reset emails via Brevo SMTP
       ├─ PostgREST   tables protected by Row Level Security
       ├─ RPCs        join_class, get_or_create_conversation, mark_conversation_read, delete_my_account
       └─ Realtime    messages + class_members (postgres_changes), typing + presence (broadcast)
```

- **Security is in the database.** Every table has RLS. Students only see their own tasks and notes and the classes they joined. Only the two people in a conversation can read it. Roles can't be changed after sign-up. Logged-out visitors can read nothing.
- **State:** Zustand stores keep their original APIs. They load from Supabase after login, update optimistically, and roll back with an error toast if a write fails.
- Only theme and view preferences are stored locally in the browser.

## Project structure

```
supabase/
  migrations/     schema, RLS, grants, realtime (apply in order)
  tests/          rls_checks.sql — security tests that roll back after running
src/
  app/            router, AuthProvider (session → profile → data → realtime)
  lib/            supabase client
  services/       rows.ts (DB ↔ app mappers), userData.ts, messages.ts, roster.ts, storage.ts
  stores/         zustand stores (auth, tasks, classes, notes, events, people/messages, settings, ui)
  features/       auth/ dashboard/ tasks/ calendar/ classes/ notes/ messages/ teachers/ settings/ onboarding/
  components/     UI primitives, command palette, task form, toasts …
  utils/          priority.ts, dates.ts, studyPlan.ts … (+ unit tests)
```

## Run locally

Requires Node 18+.

1. Install:
   ```bash
   npm install
   ```
2. Create `.env.local` (copy `.env.example`) with your Supabase **Project URL** and **publishable / anon** key. Never use the secret or service_role key.
3. Apply the SQL in `supabase/migrations/` (in order) to your Supabase project. Use **SQL Editor**, or `npx supabase link` then `npx supabase db push`.
4. In Supabase → Authentication → URL Configuration, add `http://localhost:5173/**` as a redirect URL.
5. Start the dev server:
   ```bash
   npm run dev
   ```

```bash
npm run build   # type-check + production build
npm test        # unit tests (Vitest)
npm run lint    # ESLint
```

**Security check:** paste `supabase/tests/rls_checks.sql` into the Supabase SQL Editor and run it. It should print `ALL RLS CHECKS PASSED`. Everything it creates is rolled back.

## Deployment

- **Vercel** builds every push to `main` (`vercel.json` handles routing and caching).
  - Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the Vercel project settings.
- **Supabase Auth** → URL Configuration: Site URL = the Vercel URL. Redirect URLs include the Vercel URL and localhost.
- **Email:** Supabase sends auth emails through **Brevo** SMTP (`smtp-relay.brevo.com:587`).
  - The free plan sends up to 300 emails a day.
  - For better inbox placement, verify your own domain in Brevo and use a sender on that domain.
- **CI:** GitHub Actions runs lint, tests and build on every push and pull request.
