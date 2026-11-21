import { useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Bookmark, ChevronRight, FilePen, GraduationCap, Plus, Search } from 'lucide-react';
import type { ClassItem, Note } from '@/types';
import { useNoteStore } from '@/stores/noteStore';
import { useDebounce } from '@/hooks/useDebounce';
import { subjectVars } from '@/utils/colors';
import { cn } from '@/utils/cn';
import { Input } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { groupByUnit, snippet } from './noteUtils';

type Filter = 'all' | 'bookmarked' | 'mine';

function NoteLink({
  note,
  bookmarked,
  children,
}: {
  note: Note;
  bookmarked: boolean;
  children?: React.ReactNode;
}) {
  return (
    <NavLink
      to={`/notes/${note.id}`}
      className={({ isActive }) =>
        cn(
          'flex items-start gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors',
          isActive ? 'bg-accent-soft font-semibold text-accent-text' : 'text-fg hover:bg-surface-2',
        )
      }
    >
      {note.kind === 'teacher' ? (
        <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 opacity-60" aria-label="Teacher note" />
      ) : (
        <FilePen className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-label="My note" />
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate">{note.title}</span>
        {children}
      </span>
      {bookmarked && (
        <Bookmark
          className="mt-0.5 h-3.5 w-3.5 shrink-0 fill-current text-warning"
          aria-label="Bookmarked"
        />
      )}
    </NavLink>
  );
}

function ClassGroup({
  cls,
  notes,
  bookmarks,
}: {
  cls: ClassItem | undefined;
  notes: Note[];
  bookmarks: string[];
}) {
  const [open, setOpen] = useState(true);
  const v = cls ? subjectVars(cls.color) : null;
  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm font-bold hover:bg-surface-2"
      >
        <ChevronRight
          className={cn('h-4 w-4 text-muted transition-transform', open && 'rotate-90')}
          aria-hidden
        />
        <span
          aria-hidden
          className="h-2.5 w-2.5 rounded-full"
          style={{ background: v?.solid ?? 'var(--text-subtle)' }}
        />
        <span className="truncate">{cls?.name ?? 'Unsorted'}</span>
        <span className="ml-auto text-xs font-medium text-muted">{notes.length}</span>
      </button>
      {open && (
        <ul className="mt-0.5 mb-2 ml-4 border-l border-border pl-2">
          {groupByUnit(notes).map(([unit, list]) => (
            <li key={unit} className="mb-1">
              <p className="px-2 pt-1.5 pb-0.5 text-[11px] font-bold tracking-wide text-subtle uppercase">
                {unit}
              </p>
              <ul>
                {list.map((n) => (
                  <li key={n.id}>
                    <NoteLink note={n} bookmarked={bookmarks.includes(n.id)} />
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export function NotesSidebar({ classes, onNew }: { classes: ClassItem[]; onNew: () => void }) {
  const notes = useNoteStore((s) => s.notes);
  const bookmarks = useNoteStore((s) => s.bookmarks);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const q = useDebounce(query.trim().toLowerCase(), 150);

  const filtered = useMemo(
    () =>
      notes.filter((n) => {
        if (filter === 'bookmarked' && !bookmarks.includes(n.id)) return false;
        if (filter === 'mine' && n.kind !== 'mine') return false;
        return !q || `${n.title} ${n.unit} ${n.content}`.toLowerCase().includes(q);
      }),
    [notes, bookmarks, filter, q],
  );

  const groups = [
    ...classes.map((c) => ({ cls: c as ClassItem | undefined, id: c.id })),
    { cls: undefined, id: '__none' },
  ]
    .map(({ cls, id }) => ({
      cls,
      id,
      notes: filtered.filter((n) =>
        cls ? n.classId === cls.id : !classes.some((c) => c.id === n.classId),
      ),
    }))
    .filter((g) => g.notes.length > 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search all notes…"
            aria-label="Search notes"
            className="pl-9"
          />
        </div>
        <Button aria-label="New note" className="px-3" onClick={onNew}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <Tabs<Filter>
        label="Note filter"
        layoutId="note-filter"
        value={filter}
        onChange={setFilter}
        className="w-full [&>button]:flex-1"
        items={[
          { id: 'all', label: 'All' },
          { id: 'bookmarked', label: 'Saved' },
          { id: 'mine', label: 'Mine' },
        ]}
      />
      <nav aria-label="Notes" className="min-h-0">
        {q ? (
          <ul className="space-y-1" aria-live="polite">
            {filtered.length === 0 && (
              <li className="px-2 py-6 text-center text-sm text-muted">
                No notes match “{query}”.
              </li>
            )}
            {filtered.map((n) => (
              <li key={n.id}>
                <NoteLink note={n} bookmarked={bookmarks.includes(n.id)}>
                  <span className="mt-0.5 line-clamp-2 block text-xs font-normal text-muted">
                    {snippet(n.content, q)}
                  </span>
                </NoteLink>
              </li>
            ))}
          </ul>
        ) : groups.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted">
            {filter === 'bookmarked'
              ? 'Bookmark notes to find them fast.'
              : filter === 'mine'
                ? 'You haven’t written any notes yet.'
                : 'No notes yet.'}
          </p>
        ) : (
          <ul className="space-y-0.5">
            {groups.map((g) => (
              <ClassGroup key={g.id} cls={g.cls} notes={g.notes} bookmarks={bookmarks} />
            ))}
          </ul>
        )}
      </nav>
    </div>
  );
}
