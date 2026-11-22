import { create } from 'zustand';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { AccentColor, FeatureKey, SchoolSettings, SignupPolicy } from '@/types';
import { supabase } from '@/lib/supabase';
import { toast } from './uiStore';

export const DEFAULT_FEATURES: Record<FeatureKey, boolean> = {
  messaging: true,
  student_start: true,
  office_hours: true,
  class_notes: true,
  private_notes: true,
};

export const DEFAULT_SCHOOL: SchoolSettings = {
  schoolName: 'StudyHub',
  announcement: '',
  announcementTone: 'info',
  announcementAt: null,
  accent: 'indigo',
  signupPolicy: 'open',
  allowedDomain: '',
  teacherApproval: true,
  features: DEFAULT_FEATURES,
};

export interface SchoolSettingsRow {
  school_name: string;
  announcement: string;
  announcement_tone: SchoolSettings['announcementTone'];
  announcement_at: string | null;
  accent: AccentColor;
  signup_policy: SignupPolicy;
  allowed_domain: string;
  teacher_approval: boolean;
  features: Partial<Record<FeatureKey, boolean>> | null;
}

export const schoolFromRow = (r: SchoolSettingsRow): SchoolSettings => ({
  schoolName: r.school_name,
  announcement: r.announcement,
  announcementTone: r.announcement_tone,
  announcementAt: r.announcement_at,
  accent: r.accent,
  signupPolicy: r.signup_policy,
  allowedDomain: r.allowed_domain,
  teacherApproval: r.teacher_approval,
  features: { ...DEFAULT_FEATURES, ...(r.features ?? {}) },
});

/** Public subset readable before signing in. */
export interface PublicSchool {
  schoolName: string;
  accent: AccentColor;
  signupPolicy: SignupPolicy;
  allowedDomain: string;
  teacherApproval: boolean;
}

interface SchoolState {
  settings: SchoolSettings;
  /** True once the real settings have loaded (signed in) */
  loaded: boolean;
  publicInfo: PublicSchool | null;
  set: (settings: SchoolSettings) => void;
  reset: () => void;
  loadPublic: () => Promise<void>;
}

export const useSchoolStore = create<SchoolState>()((set, get) => ({
  settings: DEFAULT_SCHOOL,
  loaded: false,
  publicInfo: null,
  set: (settings) => set({ settings, loaded: true }),
  reset: () => set({ settings: DEFAULT_SCHOOL, loaded: false }),
  loadPublic: async () => {
    if (get().publicInfo) return;
    const { data, error } = await supabase.rpc('get_public_settings');
    if (error || !data) return; // older database: fall back to defaults
    const r = data as {
      school_name: string;
      accent: AccentColor;
      signup_policy: SignupPolicy;
      allowed_domain: string;
      teacher_approval: boolean;
    };
    set({
      publicInfo: {
        schoolName: r.school_name,
        accent: r.accent,
        signupPolicy: r.signup_policy,
        allowedDomain: r.allowed_domain,
        teacherApproval: r.teacher_approval,
      },
    });
  },
}));

/** Is a school feature switched on? */
export const useFeature = (key: FeatureKey) => useSchoolStore((s) => s.settings.features[key]);

export const featureOn = (key: FeatureKey) => useSchoolStore.getState().settings.features[key];

/** Teachers write class notes; everyone else writes private notes. Null when allowed. */
export function noteBlockedReason(role: string): string | null {
  const key: FeatureKey = role === 'teacher' ? 'class_notes' : 'private_notes';
  return featureOn(key)
    ? null
    : role === 'teacher'
      ? 'Class notes are turned off by your school right now.'
      : 'Private notes are turned off by your school right now.';
}

/** The school name to show (public info before sign-in, real settings after). */
export function useSchoolName(): string {
  return useSchoolStore((s) =>
    s.loaded ? s.settings.schoolName : (s.publicInfo?.schoolName ?? DEFAULT_SCHOOL.schoolName),
  );
}

export async function loadSchoolSettings(): Promise<void> {
  const { data, error } = await supabase
    .from('school_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle<SchoolSettingsRow>();
  // Before the admin migration runs there is no table: keep defaults.
  if (error || !data) return;
  useSchoolStore.getState().set(schoolFromRow(data));
}

/** Live updates when the admin changes settings. */
export function subscribeToSchool(notify: boolean): () => void {
  let channel: RealtimeChannel | null = supabase
    .channel('school-settings')
    .on<SchoolSettingsRow>(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'school_settings' },
      ({ new: row }) => {
        const before = useSchoolStore.getState().settings;
        const next = schoolFromRow(row);
        useSchoolStore.getState().set(next);
        if (notify && next.announcement && next.announcementAt !== before.announcementAt) {
          toast({ title: 'New announcement', description: next.announcement });
        }
      },
    )
    .subscribe();
  return () => {
    if (channel) void supabase.removeChannel(channel);
    channel = null;
  };
}
