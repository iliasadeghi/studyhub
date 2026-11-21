import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarClock, Mail, MessageCircle, Search, Star, Users } from 'lucide-react';
import type { Teacher } from '@/types';
import { useTeacherStore } from '@/stores/teacherStore';
import { useClassStore } from '@/stores/classStore';
import { useProfile } from '@/stores/authStore';
import { buildMailto } from '@/utils/mailto';
import { formatTime12, WEEKDAY_SHORT } from '@/utils/dates';
import { Input } from '@/components/ui/Field';
import { SubjectTag } from '@/components/ui/Badge';
import { Avatar, EmptyState, PageHeader } from '@/components/ui/Misc';
import { Button } from '@/components/ui/Button';
import { BookingModal } from './BookingModal';
import { CONTACT_LABELS } from './teacherUtils';

export default function TeachersPage() {
  const teachers = useTeacherStore((s) => s.teachers);
  const messages = useTeacherStore((s) => s.messages);
  const classes = useClassStore((s) => s.classes);
  const me = useProfile();
  const teacherView = me.role === 'teacher';
  const label = teacherView ? 'students' : 'teachers';
  const [query, setQuery] = useState('');
  const [booking, setBooking] = useState<Teacher | null>(null);
  const q = query.trim().toLowerCase();
  const visible = teachers.filter(
    (t) => !q || `${t.name} ${t.subjects.join(' ')}`.toLowerCase().includes(q),
  );

  return (
    <>
      <PageHeader
        title={teacherView ? 'Students' : 'Teachers'}
        description={
          teacherView
            ? 'Everyone enrolled in your classes. Message them directly.'
            : 'Reach out early — teachers love students who ask questions.'
        }
      />
      <div className="relative mb-5 max-w-sm">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted"
          aria-hidden
        />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${label} or classes…`}
          aria-label={`Search ${label}`}
          className="pl-9"
        />
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title={teachers.length ? `No ${label} match` : `No ${label} yet`}
          description={
            teachers.length
              ? 'Try a different search.'
              : teacherView
                ? 'Share a class join code. Students appear here once they join.'
                : 'Join a class with the code from your teacher and they’ll appear here.'
          }
        />
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((t, i) => {
            const teacherClasses = teacherView
              ? classes.filter((c) => t.subjects.includes(c.name))
              : classes.filter((c) => c.teacherId === t.id);
            const unread = messages.filter(
              (m) => m.contactId === t.id && !m.mine && !m.read,
            ).length;
            const mailto = buildMailto({
              to: t.email,
              className: teacherClasses[0]?.name,
              topic: 'Question',
            });
            return (
              <motion.li
                key={t.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex flex-col rounded-lg border border-border bg-surface p-5 shadow-soft"
              >
                <div className="flex items-start gap-3">
                  <Avatar name={t.name} color={t.avatarColor} size="lg" />
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/messages/${t.id}`}
                      className="block truncate text-lg font-bold hover:text-accent-text"
                    >
                      {t.name}
                    </Link>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {teacherClasses.length > 0 ? (
                        teacherClasses.map((c) => (
                          <SubjectTag key={c.id} color={c.color}>
                            {c.name}
                          </SubjectTag>
                        ))
                      ) : (
                        <span className="text-sm text-muted">{t.subjects.join(', ')}</span>
                      )}
                    </div>
                  </div>
                  {unread > 0 && (
                    <span className="grid h-6 min-w-6 place-items-center rounded-full bg-accent px-1.5 text-xs font-bold text-accent-fg">
                      {unread}
                      <span className="sr-only"> unread messages</span>
                    </span>
                  )}
                </div>
                <dl className="mt-4 space-y-2 text-sm">
                  {!teacherView && (
                    <div className="flex gap-2">
                      <dt className="flex shrink-0 items-center gap-1.5 text-muted">
                        <CalendarClock className="h-4 w-4" aria-hidden />
                        <span className="sr-only">Office hours</span>
                      </dt>
                      <dd className="text-muted">
                        {t.officeHours.length
                          ? t.officeHours
                              .map((o) => `${WEEKDAY_SHORT[o.day]} ${formatTime12(o.start)}`)
                              .join(' · ')
                          : 'No office hours listed'}
                      </dd>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <dt className="flex shrink-0 items-center text-muted">
                      <Mail className="h-4 w-4" aria-hidden />
                      <span className="sr-only">Email</span>
                    </dt>
                    <dd className="truncate text-muted">{t.email || '—'}</dd>
                  </div>
                  {!teacherView && (
                    <div className="flex gap-2">
                      <dt className="flex shrink-0 items-center text-muted">
                        <Star className="h-4 w-4" aria-hidden />
                        <span className="sr-only">Preferred contact</span>
                      </dt>
                      <dd className="text-muted">
                        Prefers{' '}
                        <span className="font-semibold text-fg">
                          {CONTACT_LABELS[t.preferredContact].toLowerCase()}
                        </span>
                      </dd>
                    </div>
                  )}
                </dl>
                <div className="mt-auto flex flex-wrap gap-2 pt-5">
                  <Link
                    to={`/messages/${t.id}`}
                    className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-sm bg-accent px-3 text-sm font-semibold text-accent-fg hover:bg-accent-hover"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden /> Message
                  </Link>
                  {t.email && (
                    <a
                      href={mailto}
                      className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-sm border border-border px-3 text-sm font-semibold hover:bg-surface-2"
                      aria-label={`Email ${t.name}`}
                    >
                      <Mail className="h-4 w-4" aria-hidden /> Email
                    </a>
                  )}
                  {!teacherView && t.officeHours.length > 0 && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-9 flex-1"
                      onClick={() => setBooking(t)}
                      aria-label={`Book office hours with ${t.name}`}
                    >
                      Book
                    </Button>
                  )}
                </div>
              </motion.li>
            );
          })}
        </ul>
      )}
      {booking && !teacherView && (
        <BookingModal
          open={!!booking}
          onClose={() => setBooking(null)}
          teacher={booking}
          classItem={classes.find((c) => c.teacherId === booking.id)}
        />
      )}
    </>
  );
}
