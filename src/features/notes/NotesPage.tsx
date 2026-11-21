import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { formatDistanceToNowStrict } from 'date-fns';
import { ArrowLeft, BookOpenText, Clock } from 'lucide-react';
import { useNoteStore } from '@/stores/noteStore';
import { useProfile } from '@/stores/authStore';
import { toast } from '@/stores/uiStore';
import { useClassMap, useClassStore } from '@/stores/classStore';
import { cn } from '@/utils/cn';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/Misc';
import { Button } from '@/components/ui/Button';
import { NotesSidebar } from './NotesSidebar';
import { NoteReader } from './NoteReader';
import { NoteEditor } from './NoteEditor';

function NotesHome() {
  const notes = useNoteStore((s) => s.notes);
  const lastViewed = useNoteStore((s) => s.lastViewed);
  const recent = notes
    .filter((n) => lastViewed[n.id])
    .sort((a, b) => lastViewed[b.id].localeCompare(lastViewed[a.id]))
    .slice(0, 6);
  return (
    <Card className="p-6">
      <EmptyState
        icon={<BookOpenText className="h-8 w-8" />}
        title="Pick a note to start reading"
        description="Browse by class and unit, search across everything, or write your own notes with Markdown."
      />
      {recent.length > 0 && (
        <div className="mx-auto max-w-lg">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-bold tracking-wide text-muted uppercase">
            <Clock className="h-3.5 w-3.5" aria-hidden /> Last viewed
          </p>
          <ul className="divide-y divide-border rounded-md border border-border">
            {recent.map((n) => (
              <li key={n.id}>
                <Link
                  to={`/notes/${n.id}`}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm hover:bg-surface-2"
                >
                  <span className="truncate font-semibold">{n.title}</span>
                  <span className="shrink-0 text-xs text-muted">
                    {formatDistanceToNowStrict(new Date(lastViewed[n.id]), { addSuffix: true })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

export default function NotesPage() {
  const { noteId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const note = useNoteStore((s) => s.notes.find((n) => n.id === noteId));
  const addNote = useNoteStore((s) => s.addNote);
  const classes = useClassStore((s) => s.classes);
  const classMap = useClassMap();
  const me = useProfile();
  const editing = params.get('edit') === '1' && note?.authorId === me.id;

  const createNote = () => {
    const classId = note?.classId ?? classes[0]?.id;
    if (!classId) {
      toast({
        title: me.role === 'teacher' ? 'Create a class first' : 'Join a class first',
        description: 'Notes are organized by class.',
        action: { label: 'Classes', onClick: () => navigate('/classes') },
      });
      return;
    }
    const n = addNote({
      classId,
      visibility: me.role === 'teacher' ? 'class' : 'private',
      unit: note?.unit ?? 'General',
      title: 'Untitled note',
      content: '# Untitled note\n\nStart writing here…\n',
    });
    navigate(`/notes/${n.id}?edit=1`);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
      <aside
        className={cn(
          'lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto lg:pr-1 scrollbar-thin',
          noteId && 'hidden lg:block',
        )}
        data-print-hide
      >
        <h1 className="mb-4 text-2xl font-extrabold tracking-tight">Notes</h1>
        <NotesSidebar classes={classes} onNew={createNote} />
      </aside>

      <div className={cn('min-w-0', !noteId && 'hidden lg:block')}>
        {noteId && (
          <Link
            to="/notes"
            className="mb-4 inline-flex items-center gap-1.5 rounded-sm text-sm font-semibold text-muted hover:text-fg lg:hidden"
            data-print-hide
          >
            <ArrowLeft className="h-4 w-4" aria-hidden /> All notes
          </Link>
        )}
        {!noteId ? (
          <NotesHome />
        ) : !note ? (
          <EmptyState
            icon={<BookOpenText className="h-8 w-8" />}
            title="Note not found"
            description="It may have been deleted."
            action={<Button onClick={() => navigate('/notes')}>Back to notes</Button>}
          />
        ) : editing ? (
          <NoteEditor key={note.id} note={note} classes={classes} />
        ) : (
          <NoteReader note={note} cls={classMap[note.classId]} />
        )}
      </div>
    </div>
  );
}
