import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format, isAfter } from 'date-fns';
import { motion } from 'framer-motion';
import { CalendarClock, Copy, GraduationCap, MessageCircle, Plus, Users } from 'lucide-react';
import { useProfile } from '@/stores/authStore';
import { useClassStore } from '@/stores/classStore';
import { useEventStore } from '@/stores/eventStore';
import { useTeacherStore } from '@/stores/teacherStore';
import { useUIStore } from '@/stores/uiStore';
import { useUnreadCount } from '@/hooks/useUnread';
import { useNow } from '@/hooks/useNow';
import { greeting } from '@/utils/dates';
import { subjectVars } from '@/utils/colors';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Misc';
import { ClassFormModal } from '@/features/classes/ClassFormModal';
import { SubjectArt } from '@/features/classes/art/SubjectArt';
import { RecentMessagesCard } from './RecentCards';

function Stat({
  icon,
  label,
  value,
  to,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  to: string;
}) {
  return (
    <Link to={to} className="group">
      <Card interactive className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-md bg-accent-soft text-accent-text">
          {icon}
        </span>
        <div>
          <p className="text-2xl leading-none font-extrabold">{value}</p>
          <p className="mt-1 text-xs text-muted group-hover:text-fg">{label}</p>
        </div>
      </Card>
    </Link>
  );
}

export function TeacherDashboard() {
  const me = useProfile();
  const classes = useClassStore((s) => s.classes);
  const rosters = useClassStore((s) => s.rosters);
  const bookings = useEventStore((s) => s.bookings);
  const people = useTeacherStore((s) => s.teachers);
  const pushToast = useUIStore((s) => s.pushToast);
  const unread = useUnreadCount();
  const now = useNow();
  const [createOpen, setCreateOpen] = useState(false);

  const students = new Set(
    Object.values(rosters)
      .flat()
      .map((s) => s.id),
  ).size;
  const upcoming = bookings
    .filter((b) => b.status === 'booked' && isAfter(new Date(b.end), now))
    .sort((a, b) => a.start.localeCompare(b.start));
  const nameOf = (id: string) => people.find((p) => p.id === id)?.name ?? 'Student';

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      pushToast({ variant: 'success', title: 'Join code copied', description: code });
    } catch {
      pushToast({ title: 'Join code', description: code });
    }
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-accent-text">{format(now, 'EEEE, MMMM d')}</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
            {greeting(now)}, {me.fullName.split(' ').slice(0, 2).join(' ') || 'there'} 👋
          </h1>
          <p className="mt-1 text-muted">
            {unread > 0
              ? `You have ${unread} unread message${unread > 1 ? 's' : ''} from students.`
              : 'All caught up on messages.'}
          </p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setCreateOpen(true)}>
          New class
        </Button>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          icon={<GraduationCap className="h-5 w-5" />}
          label="Classes"
          value={classes.length}
          to="/classes"
        />
        <Stat icon={<Users className="h-5 w-5" />} label="Students" value={students} to="/people" />
        <Stat
          icon={<MessageCircle className="h-5 w-5" />}
          label="Unread messages"
          value={unread}
          to="/messages"
        />
        <Stat
          icon={<CalendarClock className="h-5 w-5" />}
          label="Upcoming bookings"
          value={upcoming.length}
          to="/calendar"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="My classes"
            subtitle="Share a join code so students can enroll"
            icon={<GraduationCap className="h-4 w-4" />}
          />
          {classes.length === 0 ? (
            <EmptyState
              compact
              icon={<GraduationCap className="h-6 w-6" />}
              title="No classes yet"
              description="Create your first class to get a join code for your students."
              action={
                <Button size="sm" onClick={() => setCreateOpen(true)}>
                  Create class
                </Button>
              }
            />
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {classes.map((c, i) => (
                <motion.li
                  key={c.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="overflow-hidden rounded-md border border-border"
                >
                  <Link
                    to={`/classes/${c.id}`}
                    className="relative block h-16"
                    style={{ background: subjectVars(c.color).soft }}
                    aria-label={`Open ${c.name}`}
                  >
                    <SubjectArt cls={c} className="absolute inset-0 h-full w-full py-1 pr-2" />
                  </Link>
                  <div className="flex items-center justify-between gap-2 p-3">
                    <div className="min-w-0">
                      <Link
                        to={`/classes/${c.id}`}
                        className="block truncate text-sm font-bold hover:text-accent-text"
                      >
                        {c.name}
                      </Link>
                      <p className="text-xs text-muted">{rosters[c.id]?.length ?? 0} students</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void copy(c.joinCode)}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-sm border border-border px-2 py-1 font-mono text-xs font-bold tracking-wider hover:bg-surface-2"
                      aria-label={`Copy join code ${c.joinCode} for ${c.name}`}
                    >
                      {c.joinCode}
                      <Copy className="h-3.5 w-3.5 text-muted" aria-hidden />
                    </button>
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Office-hour bookings"
            icon={<CalendarClock className="h-4 w-4" />}
            action={
              <Link
                to="/settings#office-hours"
                className="rounded-sm px-2 py-1 text-xs font-semibold text-accent-text hover:bg-accent-soft"
              >
                Edit hours
              </Link>
            }
          />
          {upcoming.length === 0 ? (
            <EmptyState
              compact
              icon={<CalendarClock className="h-6 w-6" />}
              title="No bookings"
              description="When students book your office hours, they’ll appear here."
            />
          ) : (
            <ul className="divide-y divide-border">
              {upcoming.slice(0, 6).map((b) => (
                <li key={b.id} className="py-2.5 text-sm">
                  <p className="font-semibold">{nameOf(b.studentId)}</p>
                  <p className="text-xs text-muted">
                    {format(new Date(b.start), 'EEE, MMM d · h:mm a')}
                    {b.topic && ` · ${b.topic}`}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="lg:col-span-3">
          <RecentMessagesCard />
        </div>
      </div>

      <ClassFormModal open={createOpen} onClose={() => setCreateOpen(false)} classItem={null} />
    </div>
  );
}
