import { useState, type FormEvent } from 'react';
import { Check } from 'lucide-react';
import type { AccentColor, AnnouncementTone, FeatureKey, SignupPolicy } from '@/types';
import { adminService } from '@/services/admin';
import { useSchoolStore } from '@/stores/schoolStore';
import { Button } from '@/components/ui/Button';
import { Field, Input, Textarea } from '@/components/ui/Field';
import { PageHeader } from '@/components/ui/Misc';
import { ChoiceChips } from '@/components/task-form/ChoiceChips';
import { SettingsSection, Toggle } from '@/features/settings/SettingsSection';
import { ACCENTS } from '@/utils/colors';
import { runAction } from './adminHooks';

const FEATURES: { key: FeatureKey; label: string; description: string }[] = [
  {
    key: 'messaging',
    label: 'Messaging',
    description: 'Students and teachers can send messages. Off: existing messages stay readable.',
  },
  {
    key: 'student_start',
    label: 'Students can start conversations',
    description: 'Off: only teachers can start a new conversation; students can still reply.',
  },
  {
    key: 'office_hours',
    label: 'Office-hour booking',
    description: 'Students can book time in their teachers’ office hours.',
  },
  {
    key: 'class_notes',
    label: 'Class notes',
    description: 'Teachers can post and edit notes shared with their class.',
  },
  {
    key: 'private_notes',
    label: 'Private notes',
    description: 'Everyone can write their own private notes for a class.',
  },
];

function save(patch: Record<string, unknown>, what: string) {
  return runAction(() => adminService.updateSettings(patch), `${what} saved`);
}

function BrandingSection() {
  const settings = useSchoolStore((s) => s.settings);
  const [name, setName] = useState(settings.schoolName);
  const [accent, setAccent] = useState<AccentColor>(settings.accent);
  const [busy, setBusy] = useState(false);
  const dirty = name.trim() !== settings.schoolName || accent !== settings.accent;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    await save({ school_name: name.trim(), accent }, 'Branding');
    setBusy(false);
  };

  return (
    <SettingsSection
      id="branding"
      title="Branding"
      description="Shown in the sidebar and on the log-in and sign-up pages."
    >
      <form onSubmit={(e) => void submit(e)} className="space-y-5">
        <Field label="School name">
          {(id) => (
            <Input
              id={id}
              value={name}
              maxLength={60}
              onChange={(e) => setName(e.target.value)}
              placeholder="Lincoln High School"
              required
            />
          )}
        </Field>
        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold">School color</legend>
          <p className="mb-3 text-xs text-muted">
            The default accent for everyone. People can still pick their own in Settings.
          </p>
          <div className="flex flex-wrap gap-3">
            {ACCENTS.map((a) => (
              <label key={a.id} className="flex cursor-pointer flex-col items-center gap-1.5">
                <input
                  type="radio"
                  name="school-accent"
                  value={a.id}
                  checked={accent === a.id}
                  onChange={() => setAccent(a.id)}
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
        <div className="flex justify-end border-t border-border pt-4">
          <Button type="submit" disabled={!dirty || busy || !name.trim()}>
            {busy ? 'Saving…' : 'Save branding'}
          </Button>
        </div>
      </form>
    </SettingsSection>
  );
}

function AnnouncementSection() {
  const settings = useSchoolStore((s) => s.settings);
  const [text, setText] = useState(settings.announcement);
  const [tone, setTone] = useState<AnnouncementTone>(settings.announcementTone);
  const [busy, setBusy] = useState(false);
  const dirty = text.trim() !== settings.announcement || tone !== settings.announcementTone;

  const publish = async (next: string) => {
    setBusy(true);
    const ok = await save(
      { announcement: next, announcement_tone: tone },
      next ? 'Announcement' : 'Announcement removal',
    );
    if (ok) setText(next);
    setBusy(false);
  };

  return (
    <SettingsSection
      id="announcement"
      title="Announcement"
      description="A banner at the top of every page for all students and teachers. It appears instantly."
    >
      <Field label="Message" hint={`${text.length}/280`}>
        {(id) => (
          <Textarea
            id={id}
            rows={3}
            maxLength={280}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="School is closed Friday for the teacher in-service day."
          />
        )}
      </Field>
      <ChoiceChips<AnnouncementTone>
        legend="Style"
        name="announcement-tone"
        value={tone}
        onChange={setTone}
        options={[
          { id: 'info', label: 'Info' },
          { id: 'success', label: 'Good news' },
          { id: 'warning', label: 'Heads up' },
          { id: 'danger', label: 'Urgent' },
        ]}
      />
      <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
        {settings.announcement && (
          <Button variant="ghost" disabled={busy} onClick={() => void publish('')}>
            Remove announcement
          </Button>
        )}
        <Button disabled={!dirty || busy || !text.trim()} onClick={() => void publish(text.trim())}>
          {busy ? 'Publishing…' : 'Publish'}
        </Button>
      </div>
    </SettingsSection>
  );
}

function SignupSection() {
  const settings = useSchoolStore((s) => s.settings);
  const [policy, setPolicy] = useState<SignupPolicy>(settings.signupPolicy);
  const [domain, setDomain] = useState(settings.allowedDomain);
  const [busy, setBusy] = useState(false);
  const cleanDomain = domain.trim().toLowerCase().replace(/^@/, '');
  const domainValid = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(cleanDomain);
  const dirty = policy !== settings.signupPolicy || cleanDomain !== settings.allowedDomain;

  return (
    <SettingsSection
      id="signups"
      title="Sign-ups"
      description="Who can create an account. Enforced by the database, not just this page."
    >
      <ChoiceChips<SignupPolicy>
        legend="New accounts"
        name="signup-policy"
        value={policy}
        onChange={setPolicy}
        options={[
          { id: 'open', label: 'Anyone with the link' },
          { id: 'domain', label: 'School email only' },
          { id: 'closed', label: 'Closed' },
        ]}
      />
      {policy === 'domain' && (
        <Field
          label="School email domain"
          hint="For example lincolnhs.org. Only addresses ending in @this domain can sign up."
        >
          {(id) => (
            <Input
              id={id}
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="lincolnhs.org"
              aria-invalid={!!domain && !domainValid}
            />
          )}
        </Field>
      )}
      <div className="flex justify-end border-t border-border pt-4">
        <Button
          disabled={!dirty || busy || (policy === 'domain' && !domainValid)}
          onClick={async () => {
            setBusy(true);
            await save({ signup_policy: policy, allowed_domain: cleanDomain }, 'Sign-up policy');
            setBusy(false);
          }}
        >
          {busy ? 'Saving…' : 'Save sign-up policy'}
        </Button>
      </div>
      <Toggle
        label="Approve new teachers"
        description="New teacher accounts wait for your approval before they can create classes."
        checked={settings.teacherApproval}
        onChange={(v) => void save({ teacher_approval: v }, 'Teacher approval')}
      />
    </SettingsSection>
  );
}

function PermissionsSection() {
  const features = useSchoolStore((s) => s.settings.features);
  return (
    <SettingsSection
      id="permissions"
      title="Permissions"
      description="Turn features on or off for the whole school. Changes apply instantly and are enforced by the database."
    >
      {FEATURES.map((f) => (
        <Toggle
          key={f.key}
          label={f.label}
          description={f.description}
          checked={features[f.key]}
          onChange={(v) => void save({ features: { [f.key]: v } }, f.label)}
        />
      ))}
    </SettingsSection>
  );
}

export default function AdminSchoolPage() {
  const loaded = useSchoolStore((s) => s.loaded);
  return (
    <>
      <PageHeader
        title="School settings"
        description="Customize StudyHub for your school and decide what students and teachers can do."
      />
      {!loaded ? (
        <p className="text-sm text-muted">
          School settings aren't available yet. Run the admin database migration first.
        </p>
      ) : (
        <div className="max-w-3xl space-y-5">
          <BrandingSection />
          <AnnouncementSection />
          <SignupSection />
          <PermissionsSection />
        </div>
      )}
    </>
  );
}
