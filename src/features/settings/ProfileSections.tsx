import { useState, type FormEvent } from 'react';
import { Check, Monitor, Moon, Sun } from 'lucide-react';
import type { AccentColor, ContactMethod, SubjectColor, TaskView, ThemeMode } from '@/types';
import { useAuthStore, useProfile } from '@/stores/authStore';
import { toast } from '@/stores/uiStore';
import { Button } from '@/components/ui/Button';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAccent } from '@/hooks/useTheme';
import { useUIStore } from '@/stores/uiStore';
import { ACCENTS } from '@/utils/colors';
import { cn } from '@/utils/cn';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { Avatar } from '@/components/ui/Misc';
import { ChoiceChips } from '@/components/task-form/ChoiceChips';
import { ColorPicker } from '@/features/classes/ClassFormModal';
import { notificationsSupported, requestNotificationPermission } from '@/services/notifications';
import { SettingsSection, Toggle } from './SettingsSection';

export function ProfileSection() {
  const profile = useProfile();
  const [name, setName] = useState(profile.fullName);
  const [grade, setGrade] = useState(profile.grade ?? '10');
  const [bio, setBio] = useState(profile.bio);
  const [contact, setContact] = useState<ContactMethod>(profile.preferredContact);
  const [color, setColor] = useState<SubjectColor>(profile.avatarColor);
  const [busy, setBusy] = useState(false);
  const teacher = profile.role === 'teacher';
  const student = profile.role === 'student';
  const dirty =
    name !== profile.fullName ||
    (student && grade !== (profile.grade ?? '10')) ||
    bio !== profile.bio ||
    contact !== profile.preferredContact ||
    color !== profile.avatarColor;

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    const ok = await useAuthStore.getState().updateProfile({
      fullName: name.trim(),
      grade: student ? grade : null,
      bio: bio.trim(),
      preferredContact: contact,
      avatarColor: color,
    });
    setBusy(false);
    if (ok) toast({ variant: 'success', title: 'Profile saved' });
  };

  return (
    <SettingsSection
      id="profile"
      title="Profile"
      description={
        teacher
          ? 'Your students see this on your profile card.'
          : student
            ? 'Your teachers see your name and color.'
            : 'Shown in the audit log and admin pages.'
      }
    >
      <form onSubmit={(e) => void save(e)} className="space-y-5">
        <div className="flex items-center gap-4">
          <Avatar name={name || 'You'} color={color} size="xl" />
          <div className={cn('grid flex-1 grid-cols-1 gap-4', student && 'sm:grid-cols-2')}>
            <Field label="Name">
              {(id) => (
                <Input
                  id={id}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                />
              )}
            </Field>
            {student && (
              <Field label="Grade">
                {(id) => (
                  <Select id={id} value={grade} onChange={(e) => setGrade(e.target.value)}>
                    {['9', '10', '11', '12'].map((g) => (
                      <option key={g} value={g}>
                        Grade {g}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            )}
          </div>
        </div>
        {teacher && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr]">
            <Field label="Short bio" hint="Shown to your students.">
              {(id) => (
                <Textarea
                  id={id}
                  rows={2}
                  maxLength={500}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Loves puzzles and a well-labeled axis."
                />
              )}
            </Field>
            <Field label="Preferred contact">
              {(id) => (
                <Select
                  id={id}
                  value={contact}
                  onChange={(e) => setContact(e.target.value as ContactMethod)}
                >
                  <option value="message">In-app message</option>
                  <option value="email">Email</option>
                  <option value="in-person">In person</option>
                </Select>
              )}
            </Field>
          </div>
        )}
        <ColorPicker legend="Avatar color" value={color} onChange={setColor} />
        <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-sm text-muted">
            Signed in as <span className="font-semibold text-fg">{profile.email}</span> ·{' '}
            {teacher ? 'Teacher' : student ? 'Student' : 'School admin'}
          </p>
          <Button type="submit" disabled={!dirty || busy || !name.trim()}>
            {busy ? 'Saving…' : 'Save profile'}
          </Button>
        </div>
      </form>
    </SettingsSection>
  );
}

export function AppearanceSection() {
  const theme = useSettingsStore((s) => s.theme);
  const { accent, chosen, school } = useAccent();
  const update = useSettingsStore((s) => s.update);
  return (
    <SettingsSection id="appearance" title="Appearance" description="Make it yours.">
      <ChoiceChips<ThemeMode>
        legend="Theme"
        name="theme"
        value={theme}
        onChange={(v) => update({ theme: v })}
        options={[
          { id: 'light', label: 'Light', icon: <Sun className="h-4 w-4" aria-hidden /> },
          { id: 'dark', label: 'Dark', icon: <Moon className="h-4 w-4" aria-hidden /> },
          { id: 'system', label: 'System', icon: <Monitor className="h-4 w-4" aria-hidden /> },
        ]}
      />
      <fieldset>
        <legend className="mb-1.5 text-sm font-semibold">Accent color</legend>
        <div className="flex flex-wrap gap-3">
          {ACCENTS.map((a) => (
            <label key={a.id} className="flex cursor-pointer flex-col items-center gap-1.5">
              <input
                type="radio"
                name="accent"
                value={a.id}
                checked={accent === a.id}
                onChange={() => update({ accent: a.id as AccentColor, accentChosen: true })}
                className="peer sr-only"
              />
              <span
                aria-hidden
                className="grid h-10 w-10 place-items-center rounded-full text-white ring-offset-2 ring-offset-surface transition-transform peer-checked:scale-110 peer-checked:ring-2 peer-checked:ring-fg peer-focus-visible:ring-2 peer-focus-visible:ring-accent"
                style={{ background: a.swatch }}
              >
                {accent === a.id && <Check className="h-4 w-4" />}
              </span>
              <span className="text-xs font-medium text-muted">{a.label}</span>
            </label>
          ))}
        </div>
        {chosen && school && (
          <button
            type="button"
            onClick={() => update({ accentChosen: false })}
            className="mt-3 text-xs font-semibold text-accent-text hover:underline"
          >
            Use the school color
          </button>
        )}
      </fieldset>
    </SettingsSection>
  );
}

export function PreferencesSection() {
  const s = useSettingsStore();
  const pushToast = useUIStore((st) => st.pushToast);
  const toggleNotifications = async (on: boolean) => {
    if (!on) return s.update({ notificationsEnabled: false });
    const ok = await requestNotificationPermission();
    s.update({ notificationsEnabled: ok });
    pushToast(
      ok
        ? {
            variant: 'success',
            title: 'Notifications on',
            description: "We'll remind you about tasks due within 24 hours.",
          }
        : {
            variant: 'error',
            title: 'Notifications blocked',
            description: 'Allow notifications for this site in your browser settings.',
          },
    );
  };
  return (
    <SettingsSection id="preferences" title="Preferences">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Default task view">
          {(id) => (
            <Select
              id={id}
              value={s.defaultTaskView}
              onChange={(e) => s.update({ defaultTaskView: e.target.value as TaskView })}
            >
              <option value="list">List</option>
              <option value="board">Board</option>
              <option value="matrix">Priority matrix</option>
            </Select>
          )}
        </Field>
        <Field label="Week starts on">
          {(id) => (
            <Select
              id={id}
              value={s.weekStartsOn}
              onChange={(e) => s.update({ weekStartsOn: Number(e.target.value) as 0 | 1 })}
            >
              <option value={1}>Monday</option>
              <option value={0}>Sunday</option>
            </Select>
          )}
        </Field>
      </div>
      <div className={cn(!notificationsSupported() && 'opacity-60')}>
        <Toggle
          label="Browser reminders"
          description={
            notificationsSupported()
              ? 'Get a notification for tasks due within 24 hours.'
              : 'Not supported in this browser.'
          }
          checked={s.notificationsEnabled}
          onChange={(v) => void toggleNotifications(v)}
        />
      </div>
    </SettingsSection>
  );
}
