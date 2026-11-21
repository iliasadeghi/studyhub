import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { MessagesSquare } from 'lucide-react';
import { useTeacherStore } from '@/stores/teacherStore';
import { useClassStore } from '@/stores/classStore';
import { useProfile } from '@/stores/authStore';
import { cn } from '@/utils/cn';
import { EmptyState } from '@/components/ui/Misc';
import { TeacherProfileCard } from '@/features/teachers/TeacherProfileCard';
import { BookingModal } from '@/features/teachers/BookingModal';
import { ConversationList } from './ConversationList';
import { ThreadPanel } from './ThreadPanel';

export default function MessagesPage() {
  const { contactId } = useParams();
  const me = useProfile();
  const contact = useTeacherStore((s) => s.teachers.find((t) => t.id === contactId));
  const classes = useClassStore((s) => s.classes);
  const [bookOpen, setBookOpen] = useState(false);
  const sharedClasses = contact
    ? classes.filter((c) =>
        me.role === 'student' ? c.teacherId === contact.id : contact.subjects.includes(c.name),
      )
    : [];
  const canBook = me.role === 'student' && contact?.role === 'teacher';

  return (
    <>
      <h1 className="sr-only">Messages</h1>
      <div
        className={cn(
          'grid h-[calc(100dvh-13rem)] min-h-[440px] grid-cols-1 overflow-hidden rounded-lg border border-border bg-surface shadow-soft md:h-[calc(100dvh-10rem)]',
          'lg:grid-cols-[300px_1fr] xl:grid-cols-[300px_1fr_320px]',
        )}
      >
        <div className={cn('min-h-0 border-border lg:border-r', contactId && 'hidden lg:block')}>
          <ConversationList />
        </div>

        <div className={cn('min-h-0', !contactId && 'hidden lg:block')}>
          {contact ? (
            <ThreadPanel key={contact.id} contact={contact} />
          ) : (
            <div className="grid h-full place-items-center">
              <EmptyState
                icon={<MessagesSquare className="h-8 w-8" />}
                title={contactId ? 'Conversation not found' : 'Your messages'}
                description={
                  me.role === 'student'
                    ? 'Pick a teacher on the left to ask a question. Replies show up here instantly.'
                    : 'Pick a student on the left. New messages from your classes show up here instantly.'
                }
              />
            </div>
          )}
        </div>

        {contact && (
          <aside
            className="scrollbar-thin hidden min-h-0 overflow-y-auto border-l border-border bg-bg p-4 xl:block"
            aria-label={`About ${contact.name}`}
          >
            <TeacherProfileCard
              teacher={contact}
              classes={sharedClasses}
              onBook={canBook ? () => setBookOpen(true) : undefined}
              showMessageLink={false}
            />
          </aside>
        )}
      </div>
      {contact && canBook && (
        <BookingModal
          open={bookOpen}
          onClose={() => setBookOpen(false)}
          teacher={contact}
          classItem={sharedClasses[0]}
        />
      )}
    </>
  );
}
