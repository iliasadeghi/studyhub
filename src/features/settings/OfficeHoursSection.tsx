import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { OfficeHour } from '@/types';
import { useTeacherStore } from '@/stores/teacherStore';
import { toast } from '@/stores/uiStore';
import { WEEKDAY_LONG } from '@/utils/dates';
import { Button, IconButton } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Field';
import { SettingsSection } from './SettingsSection';

/** Teachers: weekly office hours students can book. */
export function OfficeHoursSection() {
  const saved = useTeacherStore((s) => s.myOfficeHours);
  const [rows, setRows] = useState<OfficeHour[]>(saved);
  const [busy, setBusy] = useState(false);
  const dirty =
    JSON.stringify(rows.map(({ id: _id, ...r }) => r)) !==
    JSON.stringify(saved.map(({ id: _id, ...r }) => r));
  const invalid = rows.some((r) => !r.start || !r.end || r.end <= r.start);

  const update = (i: number, patch: Partial<OfficeHour>) =>
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  const save = async () => {
    setBusy(true);
    try {
      await useTeacherStore.getState().saveOfficeHours(rows);
      toast({
        variant: 'success',
        title: 'Office hours saved',
        description: 'Your students can book these times.',
      });
    } catch (err) {
      toast({
        variant: 'error',
        title: "Couldn't save office hours",
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <SettingsSection
      id="office-hours"
      title="Office hours"
      description="Students in your classes can book 15-minute slots in these windows."
    >
      {rows.length === 0 && <p className="text-sm text-muted">No office hours yet.</p>}
      <ul className="space-y-2">
        {rows.map((r, i) => (
          <li
            key={r.id ?? `new-${i}`}
            className="grid grid-cols-2 items-center gap-2 rounded-md border border-border p-2.5 sm:grid-cols-[1.2fr_1fr_1fr_1.4fr_auto]"
          >
            <Select
              aria-label="Day"
              value={r.day}
              onChange={(e) => update(i, { day: Number(e.target.value) })}
            >
              {WEEKDAY_LONG.map((d, n) => (
                <option key={d} value={n}>
                  {d}
                </option>
              ))}
            </Select>
            <Input
              aria-label="Starts"
              type="time"
              value={r.start}
              onChange={(e) => update(i, { start: e.target.value })}
            />
            <Input
              aria-label="Ends"
              type="time"
              value={r.end}
              onChange={(e) => update(i, { end: e.target.value })}
              aria-invalid={r.end <= r.start}
            />
            <Input
              aria-label="Location"
              value={r.location}
              placeholder="Room 204"
              onChange={(e) => update(i, { location: e.target.value })}
            />
            <IconButton
              label="Remove office hours"
              onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}
              className="justify-self-end"
            >
              <Trash2 className="h-4 w-4" />
            </IconButton>
          </li>
        ))}
      </ul>
      {invalid && (
        <p role="alert" className="text-sm text-danger-text">
          Each window must end after it starts.
        </p>
      )}
      <div className="flex flex-wrap justify-between gap-2">
        <Button
          variant="secondary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() =>
            setRows((rs) => [...rs, { day: 1, start: '15:15', end: '16:00', location: '' }])
          }
        >
          Add time
        </Button>
        <Button disabled={!dirty || invalid || busy} onClick={() => void save()}>
          {busy ? 'Saving…' : 'Save office hours'}
        </Button>
      </div>
    </SettingsSection>
  );
}
