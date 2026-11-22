import { useEffect, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { toast } from '@/stores/uiStore';
import { loadSchoolSettings, subscribeToSchool, useSchoolStore } from '@/stores/schoolStore';
import { profileFromRow, type ProfileRow } from '@/services/rows';
import { clearUserData, loadUserData } from '@/services/userData';
import { subscribeToMessages } from '@/services/messages';
import { subscribeToRoster } from '@/services/roster';
import { accessFor } from '@/features/admin/adminUtils';

/** Watch your own profile row so approval, suspension or a role change applies right away. */
function subscribeToOwnProfile(uid: string, onAccessChange: () => void): () => void {
  const channel = supabase
    .channel(`profile:${uid}`)
    .on<ProfileRow>(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${uid}` },
      ({ new: row }) => {
        const auth = useAuthStore.getState();
        const before = auth.profile;
        const next = profileFromRow(row);
        auth.set({ profile: next });
        if (before && (before.role !== next.role || accessFor(before) !== accessFor(next))) {
          onAccessChange();
        }
      },
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}

/**
 * Keeps the auth store in sync with the Supabase session: loads the user's
 * profile, school settings and data on sign-in, starts real-time updates, and
 * clears everything on sign-out. The admin and accounts that are pending,
 * suspended or archived don't load personal data.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const auth = useAuthStore.getState();
    if (!isSupabaseConfigured) {
      auth.set({ status: 'signedOut' });
      return;
    }

    let activeUser: string | null | undefined;
    let lastSession: Session | null = null;
    let stopLive: (() => void) | null = null;

    const handle = async (session: Session | null, force = false) => {
      lastSession = session;
      const uid = session?.user.id ?? null;
      if (uid === activeUser && !force) return; // token refresh or duplicate event
      activeUser = uid;
      stopLive?.();
      stopLive = null;
      clearUserData();

      if (!uid) {
        useSchoolStore.getState().reset();
        auth.set({ status: 'signedOut', userId: null, profile: null });
        return;
      }

      auth.set({ status: 'loading', userId: uid });
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', uid)
          .single<ProfileRow>();
        if (error) throw new Error(error.message);
        const profile = profileFromRow(data);
        auth.set({ profile });
        await loadSchoolSettings();

        const canUseApp = accessFor(profile) === 'ok';
        const isAdmin = profile.role === 'admin';
        if (canUseApp && !isAdmin) await loadUserData(profile);
        if (activeUser !== uid) return; // signed out while loading

        const stops = [
          subscribeToSchool(!isAdmin),
          subscribeToOwnProfile(uid, () => void handle(lastSession, true)),
        ];
        if (canUseApp && !isAdmin) {
          stops.push(subscribeToMessages(uid));
          if (profile.role === 'teacher') stops.push(subscribeToRoster(uid));
        }
        stopLive = () => stops.forEach((stop) => stop());
        auth.set({ status: 'signedIn' });
      } catch (err) {
        toast({
          variant: 'error',
          title: "Couldn't load your account",
          description: err instanceof Error ? err.message : 'Please try signing in again.',
        });
        activeUser = undefined;
        await supabase.auth.signOut();
      }
    };

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') auth.set({ recovery: true });
      // Supabase recommends not awaiting other Supabase calls inside this callback.
      window.setTimeout(() => void handle(session), 0);
    });

    return () => {
      data.subscription.unsubscribe();
      stopLive?.();
    };
  }, []);

  return <>{children}</>;
}
