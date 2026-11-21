import { useEffect, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { toast } from '@/stores/uiStore';
import { profileFromRow, type ProfileRow } from '@/services/rows';
import { clearUserData, loadUserData } from '@/services/userData';
import { subscribeToMessages } from '@/services/messages';
import { subscribeToRoster } from '@/services/roster';

/**
 * Keeps the auth store in sync with the Supabase session: loads the user's
 * profile and data on sign-in, starts the real-time inbox, and clears
 * everything on sign-out.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const auth = useAuthStore.getState();
    if (!isSupabaseConfigured) {
      auth.set({ status: 'signedOut' });
      return;
    }

    let activeUser: string | null | undefined;
    let stopInbox: (() => void) | null = null;

    const handle = async (session: Session | null) => {
      const uid = session?.user.id ?? null;
      if (uid === activeUser) return; // token refresh or duplicate event
      activeUser = uid;
      stopInbox?.();
      stopInbox = null;

      if (!uid) {
        clearUserData();
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
        await loadUserData(profile);
        if (activeUser !== uid) return; // signed out while loading
        const stopMessages = subscribeToMessages(uid);
        const stopRoster = profile.role === 'teacher' ? subscribeToRoster(uid) : null;
        stopInbox = () => {
          stopMessages();
          stopRoster?.();
        };
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
      stopInbox?.();
    };
  }, []);

  return <>{children}</>;
}
