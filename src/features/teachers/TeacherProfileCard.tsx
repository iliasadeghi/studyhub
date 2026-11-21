import { Link } from 'react-router-dom';
import { CalendarClock, Mail, MapPin, MessageCircle, Star } from 'lucide-react';
import type { ClassItem, Teacher } from '@/types';
import { CONTACT_LABELS } from './teacherUtils';
import { buildMailto } from '@/utils/mailto';
import { formatTime12, WEEKDAY_LONG } from '@/utils/dates';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Misc';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export function OfficeHoursList({ teacher }: { teacher: Teacher }) {
  if (teacher.officeHours.length === 0)
    return <p className="text-sm text-muted">No office hours listed.</p>;
  return (
    <ul className="space-y-1.5">
      {teacher.officeHours.map((oh, i) => (
        <li key={i} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm">
          <span className="w-24 font-semibold">{WEEKDAY_LONG[oh.day]}</span>
          <span className="text-muted tabular-nums">
            {formatTime12(oh.start)} – {formatTime12(oh.end)}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-muted">
            <MapPin className="h-3 w-3" aria-hidden />
            {oh.location}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function TeacherProfileCard({
  teacher,
  classes,
  onBook,
  showMessageLink = true,
}: {
  teacher: Teacher;
  classes: ClassItem[];
  onBook?: () => void;
  showMessageLink?: boolean;
}) {
  const primary = classes[0];
  const mailto = buildMailto({ to: teacher.email, className: primary?.name, topic: 'Question' });

  return (
    <Card>
      <div className="flex flex-wrap items-start gap-4">
        <Avatar name={teacher.name} color={primary?.color ?? 'purple'} size="lg" />
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-extrabold">{teacher.name}</h2>
          <p className="text-sm text-muted">{teacher.subjects.join(', ') || 'Teacher'}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge tone="accent" icon={<Star className="h-3 w-3" aria-hidden />}>
              Prefers {CONTACT_LABELS[teacher.preferredContact]}
            </Badge>
          </div>
        </div>
      </div>
      {teacher.bio && <p className="mt-4 text-sm leading-relaxed">{teacher.bio}</p>}

      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <section>
          <h3 className="mb-2 text-xs font-bold tracking-wide text-muted uppercase">
            Office hours
          </h3>
          <OfficeHoursList teacher={teacher} />
        </section>
        <section>
          <h3 className="mb-2 text-xs font-bold tracking-wide text-muted uppercase">Contact</h3>
          {teacher.email ? (
            <a
              href={`mailto:${teacher.email}`}
              className="text-sm font-medium break-all text-accent-text hover:underline"
            >
              {teacher.email}
            </a>
          ) : (
            <p className="text-sm text-muted">No email on file.</p>
          )}
        </section>
      </div>

      <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
        {showMessageLink && (
          <Link
            to={`/teachers/${teacher.id}`}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-accent px-4 text-sm font-semibold text-accent-fg shadow-soft hover:bg-accent-hover"
          >
            <MessageCircle className="h-4 w-4" aria-hidden /> Message
          </Link>
        )}
        {teacher.email && (
          <a
            href={mailto}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-surface px-4 text-sm font-semibold hover:bg-surface-2"
          >
            <Mail className="h-4 w-4" aria-hidden /> Email teacher
          </a>
        )}
        {onBook && teacher.officeHours.length > 0 && (
          <Button
            variant="secondary"
            leftIcon={<CalendarClock className="h-4 w-4" />}
            onClick={onBook}
          >
            Book a time
          </Button>
        )}
      </div>
    </Card>
  );
}
