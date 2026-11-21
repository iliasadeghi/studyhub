import { useMemo, useState, type FormEvent } from 'react';
import { format } from 'date-fns';
import { upcomingSlots } from './teacherUtils';
import type { ClassItem, Teacher } from '@/types';
import { useEventStore } from '@/stores/eventStore';
import { useUIStore } from '@/stores/uiStore';
import { formatTime12 } from '@/utils/dates';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';

function BookingForm({
  teacher,
  classItem,
  onDone,
}: {
  teacher: Teacher;
  classItem?: ClassItem;
  onDone: () => void;
}) {
  const addEvent = useEventStore((s) => s.addEvent);
  const pushToast = useUIStore((s) => s.pushToast);
  const slots = useMemo(() => upcomingSlots(teacher, new Date()), [teacher]);
  const days = [...new Set(slots.map((s) => format(s.start, 'yyyy-MM-dd')))];
  const [day, setDay] = useState(days[0] ?? '');
  const daySlots = slots.filter((s) => format(s.start, 'yyyy-MM-dd') === day);
  const [slotKey, setSlotKey] = useState(daySlots[0]?.key ?? '');
  const [topic, setTopic] = useState('');
  const [notes, setNotes] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const slot = slots.find((s) => s.key === slotKey);
    if (!slot) return;
    addEvent({
      title: `Office hours: ${teacher.name}`,
      start: slot.start.toISOString(),
      end: new Date(slot.start.getTime() + 15 * 60_000).toISOString(),
      classId: classItem?.id ?? null,
      teacherId: teacher.id,
      kind: 'office-hours',
      notes: [topic, slot.location, notes].filter(Boolean).join(' · '),
    });
    pushToast({
      variant: 'success',
      title: 'Booked!',
      description: `${format(slot.start, 'EEE, MMM d')} at ${format(slot.start, 'h:mm a')} — added to your calendar.`,
    });
    onDone();
  };

  if (slots.length === 0)
    return <p className="text-sm text-muted">No open office-hour slots in the next two weeks.</p>;

  return (
    <form id="booking-form" onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Day">
          {(id) => (
            <Select
              id={id}
              value={day}
              onChange={(e) => {
                setDay(e.target.value);
                setSlotKey(
                  slots.find((s) => format(s.start, 'yyyy-MM-dd') === e.target.value)?.key ?? '',
                );
              }}
            >
              {days.map((d) => (
                <option key={d} value={d}>
                  {format(new Date(`${d}T00:00`), 'EEEE, MMM d')}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Time (15 min)">
          {(id) => (
            <Select id={id} value={slotKey} onChange={(e) => setSlotKey(e.target.value)}>
              {daySlots.map((s) => (
                <option key={s.key} value={s.key}>
                  {formatTime12(format(s.start, 'HH:mm'))} · {s.location}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>
      <Field label="What do you want to go over?">
        {(id) => (
          <Input
            id={id}
            data-autofocus
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Synthetic division practice"
          />
        )}
      </Field>
      <Field label="Notes (optional)">
        {(id) => (
          <Textarea id={id} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        )}
      </Field>
      <p className="text-xs text-muted">
        This is a demo — the booking is saved to your calendar only.
      </p>
    </form>
  );
}

export function BookingModal({
  open,
  onClose,
  teacher,
  classItem,
}: {
  open: boolean;
  onClose: () => void;
  teacher: Teacher;
  classItem?: ClassItem;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Book office hours`}
      description={`with ${teacher.name}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="booking-form">
            Book slot
          </Button>
        </>
      }
    >
      {open && <BookingForm teacher={teacher} classItem={classItem} onDone={onClose} />}
    </Modal>
  );
}
