import { Link, useNavigate } from 'react-router-dom';
import { BookOpenText, FilePen, GraduationCap, Plus } from 'lucide-react';
import { format } from 'date-fns';
import type { Note } from '@/types';
import { useNoteStore } from '@/stores/noteStore';
import { useProfile } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/Misc';
import { groupByUnit } from '@/features/notes/noteUtils';
import { noteBlockedReason } from '@/stores/schoolStore';
import { toast } from '@/stores/uiStore';

export function ClassNotesList({ classId, notes }: { classId: string; notes: Note[] }) {
  const navigate = useNavigate();
  const addNote = useNoteStore((s) => s.addNote);
  const role = useProfile().role;
  const teacher = role === 'teacher';
  const create = () => {
    const blocked = noteBlockedReason(role);
    if (blocked) return toast({ title: 'Notes are off', description: blocked });
    const n = addNote({
      classId,
      visibility: teacher ? 'class' : 'private',
      unit: notes[0]?.unit ?? 'General',
      title: 'Untitled note',
      content: '# Untitled note\n\n',
    });
    navigate(`/notes/${n.id}?edit=1`);
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={create}>
          New note
        </Button>
      </div>
      {notes.length === 0 ? (
        <EmptyState
          icon={<BookOpenText className="h-8 w-8" />}
          title="No notes yet"
          description="Your teacher's notes and your own will appear here."
        />
      ) : (
        <div className="space-y-5">
          {groupByUnit(notes).map(([unit, list]) => (
            <section key={unit}>
              <h3 className="mb-2 text-xs font-bold tracking-wide text-muted uppercase">{unit}</h3>
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {list.map((n) => (
                  <li key={n.id}>
                    <Link
                      to={`/notes/${n.id}`}
                      className="flex items-center gap-3 rounded-md border border-border bg-surface p-3 shadow-soft hover:border-border-strong"
                    >
                      {n.kind === 'teacher' ? (
                        <GraduationCap className="h-5 w-5 shrink-0 text-accent-text" aria-hidden />
                      ) : (
                        <FilePen className="h-5 w-5 shrink-0 text-success" aria-hidden />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{n.title}</p>
                        <p className="text-xs text-muted">
                          Updated {format(new Date(n.updatedAt), 'MMM d')}
                        </p>
                      </div>
                      <Badge tone={n.kind === 'teacher' ? 'accent' : 'success'}>
                        {n.kind === 'teacher' ? 'Class note' : 'Private'}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
