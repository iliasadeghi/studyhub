import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpenText,
  CheckSquare,
  CornerDownLeft,
  GraduationCap,
  Keyboard,
  Moon,
  Plus,
  Search,
  UserRound,
} from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useTaskStore } from '@/stores/taskStore';
import { useNoteStore } from '@/stores/noteStore';
import { useTeacherStore } from '@/stores/teacherStore';
import { useClassStore } from '@/stores/classStore';
import { switchTheme } from '@/utils/themeTransition';
import { NAV_ITEMS, SETTINGS_ITEM } from '@/layouts/nav';
import { cn } from '@/utils/cn';
import { formatDue } from '@/utils/dates';
import { Modal } from './ui/Modal';
import { Kbd } from './ui/Misc';

interface Command {
  id: string;
  group: string;
  label: string;
  hint?: string;
  icon: ReactNode;
  run: () => void;
  keywords?: string;
}

function PaletteBody({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const tasks = useTaskStore((s) => s.tasks);
  const notes = useNoteStore((s) => s.notes);
  const teachers = useTeacherStore((s) => s.teachers);
  const classes = useClassStore((s) => s.classes);
  const ui = useUIStore.getState();

  const commands = useMemo<Command[]>(() => {
    const go = (to: string) => () => navigate(to);
    const ic = 'h-4 w-4';
    return [
      {
        id: 'new-task',
        group: 'Actions',
        label: 'New task',
        icon: <Plus className={ic} />,
        run: () => ui.openTaskForm(),
        keywords: 'add create homework',
      },
      {
        id: 'theme',
        group: 'Actions',
        label: 'Toggle dark mode',
        icon: <Moon className={ic} />,
        // Wait for the palette to close so it isn't in the snapshot.
        run: () =>
          window.setTimeout(
            () =>
              switchTheme(document.documentElement.classList.contains('dark') ? 'light' : 'dark'),
            260,
          ),
        keywords: 'theme light',
      },
      {
        id: 'shortcuts',
        group: 'Actions',
        label: 'Keyboard shortcuts',
        icon: <Keyboard className={ic} />,
        run: () => ui.setShortcutsOpen(true),
        keywords: 'help keys',
      },
      ...[...NAV_ITEMS, SETTINGS_ITEM].map((n) => ({
        id: `page-${n.to}`,
        group: 'Pages',
        label: n.label,
        icon: <n.icon className={ic} />,
        run: go(n.to),
      })),
      ...tasks
        .filter((t) => t.status !== 'done')
        .map((t) => ({
          id: t.id,
          group: 'Tasks',
          label: t.title,
          hint: formatDue(t.dueAt),
          icon: <CheckSquare className={ic} />,
          run: () => ui.openTaskForm(t),
          keywords: t.description,
        })),
      ...notes.map((n) => ({
        id: n.id,
        group: 'Notes',
        label: n.title,
        hint: n.unit,
        icon: <BookOpenText className={ic} />,
        run: go(`/notes/${n.id}`),
        keywords: n.content.slice(0, 400),
      })),
      ...classes.map((c) => ({
        id: c.id,
        group: 'Classes',
        label: c.name,
        hint: c.room,
        icon: <GraduationCap className={ic} />,
        run: go(`/classes/${c.id}`),
        keywords: c.subject,
      })),
      ...teachers.map((t) => ({
        id: t.id,
        group: 'People',
        label: t.name,
        hint: t.subjects.join(', '),
        icon: <UserRound className={ic} />,
        run: go(`/messages/${t.id}`),
        keywords: t.subjects.join(' '),
      })),
    ];
  }, [tasks, notes, classes, teachers, navigate, ui]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = q
      ? commands.filter(
          (c) => c.label.toLowerCase().includes(q) || c.keywords?.toLowerCase().includes(q),
        )
      : commands.filter((c) => c.group === 'Actions' || c.group === 'Pages');
    const perGroup = new Map<string, number>();
    return matched.filter((c) => {
      const n = (perGroup.get(c.group) ?? 0) + 1;
      perGroup.set(c.group, n);
      return n <= 6;
    });
  }, [commands, query]);

  const run = (c: Command | undefined) => {
    if (!c) return;
    onClose();
    c.run();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(results.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      run(results[active]);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 border-b border-border px-4">
        <Search className="h-5 w-5 shrink-0 text-muted" aria-hidden />
        <input
          data-autofocus
          role="combobox"
          aria-expanded="true"
          aria-controls="palette-list"
          aria-activedescendant={results[active] ? `cmd-${results[active].id}` : undefined}
          aria-label="Search commands, tasks, notes and teachers"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          placeholder="Search or jump to…"
          className="h-14 flex-1 bg-transparent text-base focus:outline-none"
        />
        <Kbd>Esc</Kbd>
      </div>
      <ul
        id="palette-list"
        role="listbox"
        aria-label="Results"
        className="scrollbar-thin max-h-[55vh] overflow-y-auto p-2"
      >
        {results.length === 0 && (
          <li className="px-3 py-10 text-center text-sm text-muted">No results for “{query}”.</li>
        )}
        {results.map((c, i) => (
          <li key={`${c.group}-${c.id}`} role="presentation">
            {(i === 0 || results[i - 1].group !== c.group) && (
              <p
                className="px-3 pt-3 pb-1 text-[11px] font-bold tracking-wide text-subtle uppercase"
                aria-hidden
              >
                {c.group}
              </p>
            )}
            <div
              id={`cmd-${c.id}`}
              role="option"
              aria-selected={i === active}
              tabIndex={-1}
              onMouseMove={() => setActive(i)}
              onClick={() => run(c)}
              onKeyDown={() => undefined}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm',
                i === active ? 'bg-accent-soft text-accent-text' : 'text-fg',
              )}
            >
              <span className="shrink-0 opacity-80">{c.icon}</span>
              <span className="min-w-0 flex-1 truncate font-medium">{c.label}</span>
              {c.hint && (
                <span className="hidden max-w-[40%] shrink-0 truncate text-xs text-muted sm:inline">
                  {c.hint}
                </span>
              )}
              {i === active && <CornerDownLeft className="h-4 w-4 shrink-0" aria-hidden />}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CommandPalette() {
  const open = useUIStore((s) => s.commandOpen);
  const setOpen = useUIStore((s) => s.setCommandOpen);
  return (
    <Modal open={open} onClose={() => setOpen(false)} title="Command palette" bare top size="md">
      {open && <PaletteBody onClose={() => setOpen(false)} />}
    </Modal>
  );
}
