import {
  Archive,
  BookOpenText,
  CalendarDays,
  CheckSquare,
  GraduationCap,
  LayoutDashboard,
  MessageCircle,
  ScrollText,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { UserRole } from '@/types';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  /** Different label per role */
  roleLabel?: Partial<Record<UserRole, string>>;
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/classes', label: 'Classes', icon: GraduationCap },
  { to: '/notes', label: 'Notes', icon: BookOpenText },
  { to: '/messages', label: 'Messages', icon: MessageCircle },
  { to: '/people', label: 'Teachers', icon: Users, roleLabel: { teacher: 'Students' } },
];

/** The school admin's console. */
export const ADMIN_NAV_ITEMS: NavItem[] = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/classes', label: 'Classes', icon: GraduationCap },
  { to: '/admin/moderation', label: 'Moderation', icon: ShieldCheck },
  { to: '/admin/school', label: 'School settings', icon: SlidersHorizontal },
  { to: '/admin/archive', label: 'Archive', icon: Archive },
  { to: '/admin/audit', label: 'Audit log', icon: ScrollText },
];

export const SETTINGS_ITEM: NavItem = { to: '/settings', label: 'Settings', icon: Settings };

export const navItemsFor = (role: UserRole | undefined): NavItem[] =>
  role === 'admin' ? ADMIN_NAV_ITEMS : NAV_ITEMS;

export const navLabel = (item: NavItem, role: UserRole | undefined) =>
  (role && item.roleLabel?.[role]) || item.label;

/** Bottom tab bar on mobile (the rest live under "More"). */
export const MOBILE_PRIMARY = ['/', '/tasks', '/messages', '/notes'];
export const ADMIN_MOBILE_PRIMARY = [
  '/admin',
  '/admin/users',
  '/admin/classes',
  '/admin/moderation',
];

export const mobilePrimaryFor = (role: UserRole | undefined) =>
  role === 'admin' ? ADMIN_MOBILE_PRIMARY : MOBILE_PRIMARY;
