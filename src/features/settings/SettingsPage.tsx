import { Keyboard } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/Misc';
import { AppearanceSection, PreferencesSection, ProfileSection } from './ProfileSections';
import { ClassManager } from './ClassManager';
import { DataSection } from './DataSection';
import { OfficeHoursSection } from './OfficeHoursSection';
import { useProfile } from '@/stores/authStore';

export default function SettingsPage() {
  const setShortcutsOpen = useUIStore((s) => s.setShortcutsOpen);
  const role = useProfile().role;
  const teacher = role === 'teacher';
  const admin = role === 'admin';
  const SECTIONS = [
    { id: 'profile', label: 'Profile' },
    ...(teacher ? [{ id: 'office-hours', label: 'Office hours' }] : []),
    { id: 'appearance', label: 'Appearance' },
    { id: 'preferences', label: 'Preferences' },
    ...(admin ? [] : [{ id: 'classes', label: 'Classes' }]),
    { id: 'account', label: 'Account & data' },
  ];
  return (
    <>
      <PageHeader
        title="Settings"
        actions={
          <Button
            variant="secondary"
            leftIcon={<Keyboard className="h-4 w-4" />}
            onClick={() => setShortcutsOpen(true)}
          >
            Shortcuts
          </Button>
        }
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[180px_1fr]">
        <nav aria-label="Settings sections" className="hidden lg:block">
          <ul className="sticky top-24 space-y-1">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="block rounded-md px-3 py-2 text-sm font-semibold text-muted hover:bg-surface-2 hover:text-fg"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="max-w-3xl space-y-5">
          <ProfileSection />
          {teacher && <OfficeHoursSection />}
          <AppearanceSection />
          <PreferencesSection />
          {!admin && <ClassManager />}
          <DataSection />
          <p className="pb-4 text-center text-xs text-subtle">
            Theme, accent and view preferences are saved on this device.
          </p>
        </div>
      </div>
    </>
  );
}
