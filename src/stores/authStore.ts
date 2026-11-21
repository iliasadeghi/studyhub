import { create } from 'zustand';
import type { Profile } from '@/types';
import { supabase } from '@/lib/supabase';
import { remote } from './sync';

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

interface AuthState {
  status: AuthStatus;
  userId: string | null;
  profile: Profile | null;
  /** True after following a password-reset email link */
  recovery: boolean;
  set: (patch: Partial<Omit<AuthState, 'set' | 'updateProfile'>>) => void;
  updateProfile: (
    patch: Partial<
      Pick<Profile, 'fullName' | 'grade' | 'avatarColor' | 'bio' | 'preferredContact' | 'onboarded'>
    >,
  ) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  status: 'loading',
  userId: null,
  profile: null,
  recovery: false,
  set: (patch) => set(patch),
  updateProfile: async (patch) => {
    const before = get().profile;
    if (!before) return false;
    set({ profile: { ...before, ...patch } });
    const row: Record<string, unknown> = {};
    if (patch.fullName !== undefined) row.full_name = patch.fullName;
    if (patch.grade !== undefined) row.grade = patch.grade;
    if (patch.avatarColor !== undefined) row.avatar_color = patch.avatarColor;
    if (patch.bio !== undefined) row.bio = patch.bio;
    if (patch.preferredContact !== undefined) row.preferred_contact = patch.preferredContact;
    if (patch.onboarded !== undefined) row.onboarded = patch.onboarded;
    return remote(
      supabase.from('profiles').update(row).eq('id', before.id),
      () => set({ profile: before }),
      'save your profile',
    );
  },
}));

/** The signed-in user's profile. Only use inside authenticated routes. */
export function useProfile(): Profile {
  const profile = useAuthStore((s) => s.profile);
  if (!profile) throw new Error('useProfile() used outside an authenticated route');
  return profile;
}

/** Current user id for store writes (throws if signed out). */
export function currentUserId(): string {
  const id = useAuthStore.getState().userId;
  if (!id) throw new Error('Not signed in');
  return id;
}
