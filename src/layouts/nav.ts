import {
  BookOpenText,
  CalendarDays,
  CheckSquare,
  GraduationCap,
  LayoutDashboard,
  Settings,
  Users,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/classes', label: 'Classes', icon: GraduationCap },
  { to: '/notes', label: 'Notes', icon: BookOpenText },
  { to: '/teachers', label: 'Teachers', icon: Users },
];

export const SETTINGS_ITEM: NavItem = { to: '/settings', label: 'Settings', icon: Settings };

/** Bottom tab bar on mobile (the rest live under "More"). */
export const MOBILE_PRIMARY = ['/', '/tasks', '/calendar', '/notes'];
