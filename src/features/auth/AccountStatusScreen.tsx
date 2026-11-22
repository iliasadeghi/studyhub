import { Archive, Hourglass, LogOut, ShieldOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useProfile } from '@/stores/authStore';
import { useSchoolName } from '@/stores/schoolStore';
import { Button } from '@/components/ui/Button';
import type { Access } from '@/features/admin/adminUtils';
import { AuthLayout } from './AuthLayout';

const COPY: Record<
  Exclude<Access, 'ok'>,
  { title: string; body: string; icon: typeof Hourglass }
> = {
  pending: {
    title: 'Waiting for approval',
    body: 'Thanks for signing up as a teacher. The school admin reviews new teacher accounts. This page will update on its own as soon as you are approved.',
    icon: Hourglass,
  },
  suspended: {
    title: 'Account suspended',
    body: 'Your account has been suspended by the school admin, so your classes, tasks and messages are unavailable. Contact your school office if you think this is a mistake.',
    icon: ShieldOff,
  },
  archived: {
    title: 'Account archived',
    body: 'This account has been archived by the school admin. Contact your school office if you need access again.',
    icon: Archive,
  },
};

/** Shown instead of the app to accounts that are pending, suspended or archived. */
export function AccountStatusScreen({ access }: { access: Exclude<Access, 'ok'> }) {
  const profile = useProfile();
  const school = useSchoolName();
  const { title, body, icon: Icon } = COPY[access];
  return (
    <AuthLayout title={title} subtitle={`${school} · ${profile.email}`}>
      <div className="flex items-start gap-3 rounded-lg border border-border bg-surface p-4 text-sm">
        <Icon
          className={
            access === 'pending'
              ? 'mt-0.5 h-5 w-5 shrink-0 text-warning'
              : 'mt-0.5 h-5 w-5 shrink-0 text-danger-text'
          }
          aria-hidden
        />
        <p role="status">{body}</p>
      </div>
      <Button
        variant="secondary"
        className="mt-6 w-full"
        leftIcon={<LogOut className="h-4 w-4" aria-hidden />}
        onClick={() => void supabase.auth.signOut({ scope: 'local' })}
      >
        Sign out
      </Button>
    </AuthLayout>
  );
}
