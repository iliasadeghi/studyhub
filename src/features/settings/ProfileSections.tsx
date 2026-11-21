import { Check, Monitor, Moon, Sun } from 'lucide-react';
import type { AccentColor, TaskView, ThemeMode } from '@/types';
import { useSettingsStore } from '@/stores/settingsStore';
import { useUIStore } from '@/stores/uiStore';
import { ACCENTS } from '@/utils/colors';
import { cn } from '@/utils/cn';
import { Field, Input, Select } from '@/components/ui/Field';
import { Avatar } from '@/components/ui/Misc';
import { ChoiceChips } from '@/components/task-form/ChoiceChips';
import { ColorPicker } from '@/features/classes/ClassFormModal';
import { notificationsSupported, requestNotificationPermission } from '@/services/notifications';
import { SettingsSection, Toggle } from './SettingsSection';

export function ProfileSection() {
  const s = useSettingsStore();
  return (
    <SettingsSection id="profile" title="Profile" description="How StudyHub greets you.">
      <div className="flex items-center gap-4">
        <Avatar name={s.name || 'Student'} color={s.avatarColor} size="xl" />
        <div className="grid flex-1 gap-4 sm:grid-cols-2">
          <Field label="Your name">
            {(id) => (
              <Input
                id={id}
                value={s.name}
                onChange={(e) => s.update({ name: e.target.value })}
                placeholder="First name"
                autoComplete="given-name"
              />
            )}
          </Field>
          <Field label="Grade">
            {(id) => (
              <Select id={id} value={s.grade} onChange={(e) => s.update({ grade: e.target.value })}>
                {['9', '10', '11', '12'].map((g) => (
                  <option key={g} value={g}>
                    Grade {g}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>
      </div>
      <ColorPicker
        legend="Avatar color"
        value={s.avatarColor}
        onChange={(c) => s.update({ avatarColor: c })}
      />
    </SettingsSection>
  );
}

export function AppearanceSection() {
  const theme = useSettingsStore((s) => s.theme);
  const accent = useSettingsStore((s) => s.accent);
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
                onChange={() => update({ accent: a.id as AccentColor })}
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
