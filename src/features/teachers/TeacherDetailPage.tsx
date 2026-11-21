import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import { useTeacherStore } from '@/stores/teacherStore';
import { useClassStore } from '@/stores/classStore';
import { messageService } from '@/services/messages';
import { buildMailto } from '@/utils/mailto';
import { Avatar } from '@/components/ui/Misc';
import NotFoundPage from '@/features/NotFoundPage';
import { MessageThread } from './MessageThread';
import { MessageComposer } from './MessageComposer';
import { TeacherProfileCard } from './TeacherProfileCard';
import { BookingModal } from './BookingModal';

export default function TeacherDetailPage() {
  const { teacherId = '' } = useParams();
  const teacher = useTeacherStore((s) => s.teachers.find((t) => t.id === teacherId));
  const allMessages = useTeacherStore((s) => s.messages);
  const typing = useTeacherStore((s) => !!s.typing[teacherId]);
  const allClasses = useClassStore((s) => s.classes);
  const [bookOpen, setBookOpen] = useState(false);

  const messages = useMemo(
    () => allMessages.filter((m) => m.teacherId === teacherId),
    [allMessages, teacherId],
  );
  const classes = allClasses.filter((c) => c.teacherId === teacherId);
  const unread = messages.some((m) => !m.read);

  useEffect(() => {
    if (unread) void messageService.markRead(teacherId);
  }, [unread, teacherId]);

  if (!teacher) return <NotFoundPage />;

  return (
    <>
      <Link
        to="/teachers"
        className="mb-4 inline-flex items-center gap-1.5 rounded-sm text-sm font-semibold text-muted hover:text-fg"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> All teachers
      </Link>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_380px]">
        <section
          aria-label="Conversation"
          className="flex h-[calc(100dvh-15rem)] min-h-[420px] flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-soft md:h-[calc(100dvh-12rem)]"
        >
          <header className="flex items-center gap-3 border-b border-border px-4 py-3">
            <Avatar name={teacher.name} color={classes[0]?.color ?? 'purple'} size="sm" />
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-bold">{teacher.name}</h1>
              <p className="truncate text-xs text-muted">
                {classes.map((c) => c.name).join(', ') || teacher.subjects.join(', ')}
              </p>
            </div>
            {teacher.email && (
              <a
                href={buildMailto({
                  to: teacher.email,
                  className: classes[0]?.name,
                  topic: 'Question',
                })}
                className="inline-flex h-9 items-center gap-1.5 rounded-sm border border-border px-3 text-sm font-semibold hover:bg-surface-2"
              >
                <Mail className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">Email</span>
              </a>
            )}
          </header>
          <div className="scrollbar-thin flex-1 overflow-y-auto px-4 py-4">
            <MessageThread teacher={teacher} messages={messages} typing={typing} />
          </div>
          <MessageComposer teacher={teacher} classItem={classes[0]} />
        </section>
        <div>
          <TeacherProfileCard
            teacher={teacher}
            classes={classes}
            onBook={() => setBookOpen(true)}
            showMessageLink={false}
          />
          <p className="mt-3 px-1 text-xs text-muted">
            Messages here are a demo stored on this device. Replies are simulated. For anything
            urgent, use email.
          </p>
        </div>
      </div>
      <BookingModal
        open={bookOpen}
        onClose={() => setBookOpen(false)}
        teacher={teacher}
        classItem={classes[0]}
      />
    </>
  );
}
