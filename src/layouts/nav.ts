import {
  BookOpenText,
  CalendarDays,
  CheckSquare,
  GraduationCap,
  LayoutDashboard,
  MessageCircle,
  Settings,
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

export const SETTINGS_ITEM: NavItem = { to: '/settings', label: 'Settings', icon: Settings };

export const navLabel = (item: NavItem, role: UserRole | undefined) =>
  (role && item.roleLabel?.[role]) || item.label;

/** Bottom tab bar on mobile (the rest live under "More"). */
export const MOBILE_PRIMARY = ['/', '/tasks', '/messages', '/notes'];
