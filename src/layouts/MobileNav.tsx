import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Keyboard, MoreHorizontal } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Modal } from '@/components/ui/Modal';
import { useUIStore } from '@/stores/uiStore';
import { useProfile } from '@/stores/authStore';
import { useUnreadCount } from '@/hooks/useUnread';
import { MOBILE_PRIMARY, NAV_ITEMS, SETTINGS_ITEM, navLabel } from './nav';

/** Bottom tab bar for phones (<768px). */
export function MobileNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const setShortcutsOpen = useUIStore((s) => s.setShortcutsOpen);
  const role = useProfile().role;
  const unread = useUnreadCount();
  const primary = NAV_ITEMS.filter((i) => MOBILE_PRIMARY.includes(i.to));
  const secondary = [...NAV_ITEMS.filter((i) => !MOBILE_PRIMARY.includes(i.to)), SETTINGS_ITEM];
  const moreActive = secondary.some((i) => location.pathname.startsWith(i.to));

  const tab =
    'flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-semibold transition-colors';

  return (
    <>
      <nav
        aria-label="Main navigation"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 pb-safe backdrop-blur-md md:hidden print:hidden"
      >
        <div className="flex h-16 items-stretch">
          {primary.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => cn(tab, isActive ? 'text-accent-text' : 'text-muted')}
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        'relative grid h-7 w-12 place-items-center rounded-full transition-colors',
                        isActive && 'bg-accent-soft',
                      )}
                    >
                      <Icon className="h-5 w-5" aria-hidden />
                      {item.to === '/messages' && unread > 0 && (
                        <span className="absolute -top-1 right-1 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-fg">
                          {unread}
                          <span className="sr-only"> unread</span>
                        </span>
                      )}
                    </span>
                    {item.label === 'Dashboard' ? 'Home' : navLabel(item, role)}
                  </>
                )}
              </NavLink>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(tab, moreActive ? 'text-accent-text' : 'text-muted')}
            aria-haspopup="dialog"
          >
            <span
              className={cn(
                'grid h-7 w-12 place-items-center rounded-full',
                moreActive && 'bg-accent-soft',
              )}
            >
              <MoreHorizontal className="h-5 w-5" aria-hidden />
            </span>
            More
          </button>
        </div>
      </nav>

      <Modal open={moreOpen} onClose={() => setMoreOpen(false)} title="More" size="sm">
        <ul className="grid grid-cols-2 gap-2 pb-2">
          {secondary.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={() => setMoreOpen(false)}
                  className="flex h-20 flex-col items-center justify-center gap-2 rounded-lg border border-border bg-surface-2 text-sm font-semibold hover:border-accent"
                >
                  <Icon className="h-5 w-5 text-accent-text" aria-hidden />
                  {navLabel(item, role)}
                </NavLink>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => {
                setMoreOpen(false);
                setShortcutsOpen(true);
              }}
              className="flex h-20 w-full flex-col items-center justify-center gap-2 rounded-lg border border-border bg-surface-2 text-sm font-semibold hover:border-accent"
            >
              <Keyboard className="h-5 w-5 text-accent-text" aria-hidden />
              Shortcuts
            </button>
          </li>
        </ul>
      </Modal>
    </>
  );
}
