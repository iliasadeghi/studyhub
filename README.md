# StudyHub 🎓

A calm, modern organizer for high school students. Track assignments, figure out what to do first, read class notes, and contact teachers, all in one place.

**Frontend only.** There is no backend, server, database or account. All data lives in your browser (`localStorage`). The app ships with realistic sample data so it feels alive on first load.

---

## Features

| Area | Highlights |
|---|---|
| **Onboarding** | 3-step welcome (name → classes → done), or *Explore with sample data* |
| **Dashboard** | Time-of-day greeting, **Focus Now** (top 3 by priority score), today + next 7 days, weekly progress ring, completion streak, workload-per-class bars, recent notes and messages |
| **Tasks** | Create/edit with class, type, due date/time, estimate, importance, status, subtasks, links. **List** (Overdue / Today / Tomorrow / This Week / Later), **Kanban board** and **Eisenhower matrix**, both with drag-and-drop. Filter, sort and search. Confetti + *Undo* toast on completion |
| **Smart priority** | 0–100 score from deadline proximity, importance, task type (test > project > quiz > homework > reading) and effort, shown as a Critical / High / Medium / Low badge with a "why" tooltip |
| **Calendar** | Month + week views, color-coded by subject, day panel, drag to reschedule, optional **study plan** that splits tests/projects into daily blocks you can add with one click |
| **Classes** | Color-coded cards. Detail page with Overview / Tasks / Notes / Teacher tabs |
| **Notes** | Class → unit tree, full-text search with snippets, bookmarks, last-viewed. Markdown reader with table of contents, adjustable font size and print styles. Your own notes get a Markdown editor with live preview and autosave |
| **Teachers** | Directory, pre-filled `mailto:` links, chat-style threads with templates and simulated replies, *Book a time* form that adds office hours to your calendar |
| **Settings** | Profile, light/dark/system theme, 5 accent colors, default task view, week start, browser reminders, manage/reorder classes, **export/import JSON**, reset to sample data |
| **Global** | Command palette (`Ctrl/⌘ K`), shortcuts help (`?`), toasts, banner for tasks due within 24 h (+ optional browser notifications), 404 page, error boundary |

### Keyboard shortcuts

| Keys | Action |
|---|---|
| `Ctrl/⌘ K` or `/` | Command palette |
| `N` | New task |
| `?` | Shortcuts help |
| `1`–`6` | Dashboard, Tasks, Calendar, Classes, Notes, Teachers |
| `Space`, arrow keys | Pick up, move and drop cards on the board/matrix |

---

## Tech stack

- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS v4** with a custom token theme (`src/styles/theme.css`)
- **React Router 6** with lazy-loaded routes
- **Zustand** + `persist` middleware (versioned `localStorage` stores)
- **Framer Motion** (respects `prefers-reduced-motion`)
- **@dnd-kit** for drag-and-drop (pointer, touch and keyboard)
- **react-markdown** + **remark-gfm** + **rehype-slug**
- **date-fns**, **lucide-react**
- **Vitest** for unit tests, **ESLint** (typescript-eslint, jsx-a11y, react-hooks) + **Prettier**

## Getting started

Requires Node 18+ (tested with Node 24).

```bash
npm install
npm run dev        # http://localhost:5173
```

Other scripts:

```bash
npm run build      # type-check + production build to dist/
npm run preview    # serve the production build
npm test           # run unit tests once
npm run lint       # ESLint
npm run format     # Prettier
```

## Folder structure

```
src/
  app/            router + theme sync
  components/
    ui/           primitives: Button, Card, Modal, Field, Badge, Tabs, Menu, Toaster, TaskCheckbox, Misc (EmptyState, Skeleton, ProgressRing, Avatar, Tooltip…)
    task-form/    global create/edit task dialog
    CommandPalette, ShortcutsModal, ReminderBanner, Celebration, ErrorBoundary, GlobalUI
  features/
    dashboard/ tasks/ calendar/ classes/ notes/ teachers/ settings/ onboarding/
  layouts/        AppLayout, Sidebar (desktop + tablet rail), Topbar, MobileNav
  stores/         taskStore, classStore, noteStore, teacherStore (+messages), eventStore, settingsStore, uiStore
  services/       messages.ts, storage.ts (export/import/reset), notifications.ts
  mockData/       6 classes, 6 teachers, 25 tasks (dates relative to today), 15 teacher notes, message threads, events
  hooks/          useHotkeys, useMediaQuery, useTheme, useNow, useDebounce
  utils/          priority.ts, dates.ts, studyPlan.ts, mailto.ts, colors.ts …  (+ *.test.ts)
  types/          shared TypeScript interfaces
  styles/         theme.css (tokens), markdown.css, print.css
```

## Design system

- **Type:** Plus Jakarta Sans (UI) and JetBrains Mono (code). Scale 12 / 14 / 15 / 17 / 20 / 24 / 30 / 36 px.
- **Color:** neutral tokens (`--bg`, `--surface`, `--text`…) redefined under `.dark`. One accent (`--accent`, switchable). Eight subject colors (`--c-blue`, `--c-green`…), each with an AA-contrast text variant for both themes.
- **Shape and motion:** radius 8 / 12 / 16 px, soft two-layer shadows (borders + glow in dark mode), 150–250 ms transitions on `cubic-bezier(.2,.8,.2,1)`.
- **Layout:** sidebar ≥ 1024 px, collapsible icon rail 768–1023 px, bottom tab bar < 768 px.

## Data and persistence

Each store persists to its own key (`studyhub:tasks`, `studyhub:classes`, `studyhub:notes`, `studyhub:teachers`, `studyhub:events`, `studyhub:settings`). Every key carries a `version` (`STORE_VERSION` in `src/stores/persist.ts`). When a persisted shape changes, bump it and add a `migrate` function to that store.

Use **Settings → Your data** to export a JSON backup, import one on another device, or reset to sample data.

## Plugging in a real backend

The UI never talks to `localStorage` directly. It goes through stores and the `services/` layer, so you can swap the data source without touching components:

1. **Messages:** `src/services/messages.ts` defines a `MessageService` interface (`send`, `markRead`, `onIncoming`). Implement it with `fetch`/WebSockets and change the `messageService` export. Then delete the simulated auto-reply.
2. **Tasks, classes, notes and events:** the store actions (`addTask`, `updateTask`, …) are the single write path. Make them call your API, either optimistically (update the store, then `await api.updateTask()` and roll back on error) or by loading from the server on start. If the server becomes the source of truth, remove the `persist` middleware.
3. **Export/import/reset:** `src/services/storage.ts` maps to endpoints such as `GET /export` and `POST /import`.
4. **Auth:** add a provider in `src/app/`, gate `AppLayout` the same way onboarding is gated today, and attach tokens inside your service functions.

## Accessibility

Semantic landmarks, a skip link, visible `:focus-visible` rings, labelled controls, focus-trapped dialogs that restore focus, arrow-key tabs and menus, keyboard drag-and-drop with screen-reader announcements, `aria-live` toasts and chat log, WCAG AA color tokens in both themes, and reduced-motion support.

## Tests

`src/utils/priority.test.ts` and `src/utils/dates.test.ts` cover the priority score, Eisenhower placement, ranking, due-date grouping, streaks, weekly progress, rescheduling, study-plan blocks and `mailto` building.
