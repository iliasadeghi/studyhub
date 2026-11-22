import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Logo } from '@/layouts/Logo';
import { accessFor } from '@/features/admin/adminUtils';
import { AccountStatusScreen } from './AccountStatusScreen';

export function Splash() {
  return (
    <div
      className="grid min-h-dvh place-items-center"
      role="status"
      aria-label="Loading your account"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="animate-pulse">
          <Logo />
        </div>
        <div className="h-1 w-40 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full w-1/3 animate-[loading-bar_1.1s_ease-in-out_infinite] rounded-full bg-accent" />
        </div>
      </div>
    </div>
  );
}

/** Signed-in users only. New users are sent to first-time setup. */
export function RequireAuth({
  children,
  allowUnonboarded = false,
}: {
  children: ReactNode;
  allowUnonboarded?: boolean;
}) {
  const status = useAuthStore((s) => s.status);
  const profile = useAuthStore((s) => s.profile);
  const location = useLocation();

  if (status === 'loading') return <Splash />;
  if (status === 'signedOut' || !profile) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  const access = accessFor(profile);
  if (access !== 'ok') return <AccountStatusScreen access={access} />;
  // The admin has no first-time setup.
  const onboarded = profile.onboarded || profile.role === 'admin';
  if (!onboarded && !allowUnonboarded) return <Navigate to="/welcome" replace />;
  if (onboarded && allowUnonboarded) return <Navigate to="/" replace />;
  return <>{children}</>;
}

/** Admin-only pages. Everyone else goes back to their dashboard. */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const role = useAuthStore((s) => s.profile?.role);
  if (role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}

/** The reverse: pages that make no sense for the admin (personal tasks, messages…). */
export function NotForAdmin({ children }: { children: ReactNode }) {
  const role = useAuthStore((s) => s.profile?.role);
  if (role === 'admin') return <Navigate to="/admin" replace />;
  return <>{children}</>;
}

/** Login/sign-up pages: send signed-in users into the app. */
export function PublicOnly({ children }: { children: ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const recovery = useAuthStore((s) => s.recovery);
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  if (status === 'loading') return <Splash />;
  if (status === 'signedIn' && !recovery)
    return <Navigate to={from && from !== '/login' ? from : '/'} replace />;
  return <>{children}</>;
}
