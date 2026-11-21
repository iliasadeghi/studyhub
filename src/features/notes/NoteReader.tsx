import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { AArrowDown, AArrowUp, Bookmark, ListTree, Pencil, Printer, Trash2 } from 'lucide-react';
import type { ClassItem, Note } from '@/types';
import { useNoteStore } from '@/stores/noteStore';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/utils/cn';
import { SubjectTag, Badge } from '@/components/ui/Badge';
import { Button, IconButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Markdown } from './Markdown';
import { extractToc, type TocEntry } from './noteUtils';

function Toc({ entries }: { entries: TocEntry[] }) {
  return (
    <ul className="space-y-1 text-sm">
      {entries.map((e) => (
        <li key={e.id} className={cn(e.depth === 3 && 'pl-3')}>
          <a
            href={`#${e.id}`}
            className="block truncate rounded-sm px-2 py-1 text-muted hover:bg-surface-2 hover:text-fg"
          >
            {e.text}
          </a>
        </li>
      ))}
    </ul>
  );
}

export function NoteReader({ note, cls }: { note: Note; cls?: ClassItem }) {
  const navigate = useNavigate();
  const bookmarked = useNoteStore((s) => s.bookmarks.includes(note.id));
  const fontScale = useNoteStore((s) => s.fontScale);
  const { toggleBookmark, setFontScale, markViewed, deleteNote } = useNoteStore.getState();
  const pushToast = useUIStore((s) => s.pushToast);
  const meId = useAuthStore((s) => s.userId);
  const toc = extractToc(note.content);

  useEffect(() => {
    markViewed(note.id);
  }, [note.id, markViewed]);

  const remove = () => {
    if (!window.confirm(`Delete "${note.title}"? This can't be undone.`)) return;
    deleteNote(note.id);
    pushToast({ title: 'Note deleted', description: note.title });
    navigate('/notes');
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_200px]">
      <Card className="min-w-0 p-5 sm:p-8">
        <header className="mb-6 border-b border-border pb-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {cls && <SubjectTag color={cls.color}>{cls.name}</SubjectTag>}
            <span className="text-xs font-semibold text-muted">{note.unit}</span>
            <Badge tone={note.kind === 'teacher' ? 'accent' : 'success'}>
              {note.kind === 'teacher' ? 'Class note' : 'Private note'}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3" data-print-hide>
            <p className="text-xs text-muted">
              Updated {format(new Date(note.updatedAt), 'MMM d, yyyy')}
            </p>
            <div className="flex flex-wrap items-center gap-1">
              <IconButton
                label="Smaller text"
                size="sm"
                onClick={() => setFontScale(fontScale - 0.1)}
                disabled={fontScale <= 0.86}
              >
                <AArrowDown className="h-4 w-4" />
              </IconButton>
              <span
                className="w-10 text-center text-xs font-semibold text-muted tabular-nums"
                aria-live="polite"
              >
                {Math.round(fontScale * 100)}%
              </span>
              <IconButton
                label="Larger text"
                size="sm"
                onClick={() => setFontScale(fontScale + 0.1)}
                disabled={fontScale >= 1.39}
              >
                <AArrowUp className="h-4 w-4" />
              </IconButton>
              <IconButton
                label={bookmarked ? 'Remove bookmark' : 'Bookmark note'}
                size="sm"
                aria-pressed={bookmarked}
                onClick={() => toggleBookmark(note.id)}
                className={cn(bookmarked && 'text-warning')}
              >
                <Bookmark className={cn('h-4 w-4', bookmarked && 'fill-current')} />
              </IconButton>
              <IconButton label="Print note" size="sm" onClick={() => window.print()}>
                <Printer className="h-4 w-4" />
              </IconButton>
              {note.authorId === meId && (
                <>
                  <IconButton label="Delete note" size="sm" onClick={remove}>
                    <Trash2 className="h-4 w-4" />
                  </IconButton>
                  <Button
                    size="sm"
                    variant="soft"
                    leftIcon={<Pencil className="h-4 w-4" />}
                    onClick={() => navigate(`/notes/${note.id}?edit=1`)}
                  >
                    Edit
                  </Button>
                </>
              )}
            </div>
          </div>
        </header>

        {toc.length > 2 && (
          <details
            className="mb-6 rounded-md border border-border bg-surface-2/60 p-3 xl:hidden"
            data-print-hide
          >
            <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
              <ListTree className="h-4 w-4" aria-hidden /> On this page
            </summary>
            <div className="mt-2">
              <Toc entries={toc} />
            </div>
          </details>
        )}

        <article aria-label={note.title}>
          <Markdown content={note.content} scale={fontScale} />
        </article>
      </Card>

      {toc.length > 2 && (
        <aside className="hidden xl:block" aria-label="Table of contents">
          <div className="sticky top-24">
            <p className="mb-2 flex items-center gap-2 px-2 text-xs font-bold tracking-wide text-muted uppercase">
              <ListTree className="h-3.5 w-3.5" aria-hidden /> On this page
            </p>
            <Toc entries={toc} />
          </div>
        </aside>
      )}
    </div>
  );
}
