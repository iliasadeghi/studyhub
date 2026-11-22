import { NavLink } from 'react-router-dom';
import { PanelLeftClose, PanelLeftOpen, Plus } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useProfile } from '@/stores/authStore';
import { useUnreadCount } from '@/hooks/useUnread';
import { useTaskStore } from '@/stores/taskStore';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { isOverdue } from '@/utils/dates';
import { cn } from '@/utils/cn';
import { Avatar, Kbd } from '@/components/ui/Misc';
import { Logo } from './Logo';
import { SETTINGS_ITEM, navItemsFor, navLabel, type NavItem } from './nav';

function NavEntry({
  item,
  label,
  compact,
  badge,
  badgeLabel = 'overdue',
  badgeTone = 'danger',
}: {
  item: NavItem;
  label: string;
  compact: boolean;
  badge?: number;
  badgeLabel?: string;
  badgeTone?: 'danger' | 'accent';
}) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      title={compact ? label : undefined}
      className={({ isActive }) =>
        cn(
          'relative flex h-10 items-center gap-3 rounded-md px-3 text-sm font-semibold transition-colors duration-150',
          compact && 'justify-center px-0',
          isActive
            ? 'bg-accent-soft text-accent-text'
            : 'text-muted hover:bg-surface-2 hover:text-fg',
        )
      }
    >
      <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
      <span className={cn(compact && 'sr-only')}>{label}</span>
      {!!badge && (
        <span
          className={cn(
            'grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-bold',
            badgeTone === 'danger'
              ? 'bg-danger text-white dark:text-[#1a0b0b]'
              : 'bg-accent text-accent-fg',
            compact ? 'absolute top-0 right-1' : 'ml-auto',
          )}
        >
          {badge}
          <span className="sr-only"> {badgeLabel}</span>
        </span>
      )}
    </NavLink>
  );
}

/** Full sidebar on desktop (≥1024px); collapsible icon rail on tablet (768–1023px). */
export function Sidebar() {
  const isDesktop = useIsDesktop();
  const expanded = useUIStore((s) => s.sidebarExpanded);
  const toggle = useUIStore((s) => s.toggleSidebar);
  const openTaskForm = useUIStore((s) => s.openTaskForm);
  const profile = useProfile();
  const name = profile.fullName || 'You';
  const avatarColor = profile.avatarColor;
  const admin = profile.role === 'admin';
  const subtitle = admin
    ? 'School admin'
    : profile.role === 'teacher'
      ? 'Teacher'
      : profile.grade
        ? `Grade ${profile.grade}`
        : 'Student';
  const unread = useUnreadCount();
  const overdue = useTaskStore((s) => s.tasks.filter((t) => isOverdue(t)).length);
  const compact = !isDesktop && !expanded;

  return (
    <>
      {!isDesktop && expanded && (
        <div
          className="fixed inset-0 z-30 hidden bg-black/30 md:block"
          onClick={toggle}
          aria-hidden
        />
      )}
      <aside
        aria-label="Main navigation"
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-border bg-surface transition-[width] duration-200 ease-smooth md:flex',
          compact ? 'w-[72px]' : 'w-[248px]',
          !isDesktop && expanded && 'shadow-pop',
        )}
      >
        <div className={cn('flex h-16 items-center px-4', compact && 'justify-center px-0')}>
          <Logo compact={compact} />
        </div>

        {!admin && (
          <div className={cn('pb-2', compact ? 'px-4' : 'px-3')}>
            <button
              type="button"
              onClick={() => openTaskForm()}
              aria-label={compact ? 'New task' : undefined}
              title={compact ? 'New task (N)' : undefined}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-accent px-3 text-sm font-semibold text-accent-fg shadow-soft transition-all hover:bg-accent-hover active:scale-[0.98]"
            >
              <Plus className="h-4 w-4 shrink-0" aria-hidden />
              {!compact && (
                <>
                  <span>New task</span>
                  <span className="ml-auto opacity-80">
                    <Kbd>N</Kbd>
                  </span>
                </>
              )}
            </button>
          </div>
        )}

        <nav
          className={cn(
            'scrollbar-thin flex-1 space-y-1 overflow-y-auto py-2',
            compact ? 'px-4' : 'px-3',
          )}
        >
          {navItemsFor(profile.role).map((item) => (
            <NavEntry
              key={item.to}
              item={item}
              label={navLabel(item, profile.role)}
              compact={compact}
              badge={item.to === '/tasks' ? overdue : item.to === '/messages' ? unread : 0}
              badgeLabel={item.to === '/messages' ? 'unread' : 'overdue'}
              badgeTone={item.to === '/messages' ? 'accent' : 'danger'}
            />
          ))}
        </nav>

        <div className={cn('space-y-1 border-t border-border py-3', compact ? 'px-4' : 'px-3')}>
          <NavEntry item={SETTINGS_ITEM} label={SETTINGS_ITEM.label} compact={compact} />
          {!isDesktop && (
            <button
              type="button"
              onClick={toggle}
              aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
              aria-expanded={expanded}
              className={cn(
                'flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm font-semibold text-muted hover:bg-surface-2 hover:text-fg',
                compact && 'justify-center px-0',
              )}
            >
              {expanded ? (
                <PanelLeftClose className="h-[18px] w-[18px]" aria-hidden />
              ) : (
                <PanelLeftOpen className="h-[18px] w-[18px]" aria-hidden />
              )}
              {!compact && <span>Collapse</span>}
            </button>
          )}
          {!compact && (
            <div className="mt-2 flex items-center gap-3 rounded-md px-2 py-2">
              <Avatar name={name} color={avatarColor} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{name}</p>
                <p className="text-xs text-muted">{subtitle}</p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
