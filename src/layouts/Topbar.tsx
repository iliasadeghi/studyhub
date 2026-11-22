import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Moon, Plus, Search, Settings, Sun } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useProfile } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { Menu } from '@/components/ui/Menu';
import { useResolvedTheme } from '@/hooks/useTheme';
import { Avatar, Kbd } from '@/components/ui/Misc';
import { IconButton } from '@/components/ui/Button';
import { centerOf, switchTheme } from '@/utils/themeTransition';
import { Logo } from './Logo';

export function Topbar() {
  const setCommandOpen = useUIStore((s) => s.setCommandOpen);
  const openTaskForm = useUIStore((s) => s.openTaskForm);
  const profile = useProfile();
  const navigate = useNavigate();
  const name = profile.fullName || 'You';
  const avatarColor = profile.avatarColor;
  const resolved = useResolvedTheme();
  const admin = profile.role === 'admin';
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-bg/80 backdrop-blur-md print:hidden">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="rounded-md md:hidden" aria-label="StudyHub home">
          <Logo compact />
        </Link>

        <button
          type="button"
          onClick={() => setCommandOpen(true)}
          className="flex h-10 min-w-0 flex-1 items-center gap-2.5 rounded-md border border-border bg-surface px-3 text-sm text-muted shadow-soft transition-colors hover:border-border-strong md:max-w-sm"
          aria-label="Search or jump to (command palette)"
        >
          <Search className="h-4 w-4 shrink-0" aria-hidden />
          <span className="truncate">
            {admin ? 'Search or jump to…' : 'Search tasks, notes, people…'}
          </span>
          <span className="ml-auto hidden items-center gap-1 sm:flex">
            <Kbd>{isMac ? '⌘' : 'Ctrl'}</Kbd>
            <Kbd>K</Kbd>
          </span>
        </button>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <IconButton
            label={resolved === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={(e) =>
              switchTheme(resolved === 'dark' ? 'light' : 'dark', centerOf(e.currentTarget))
            }
          >
            {resolved === 'dark' ? (
              <Sun className="h-[18px] w-[18px] animate-[spin-in_0.5s_var(--ease)]" />
            ) : (
              <Moon className="h-[18px] w-[18px] animate-[spin-in_0.5s_var(--ease)]" />
            )}
          </IconButton>
          {!admin && (
            <IconButton
              label="New task"
              variant="soft"
              onClick={() => openTaskForm()}
              className="md:hidden"
            >
              <Plus className="h-5 w-5" />
            </IconButton>
          )}
          <Menu
            items={[
              {
                label: 'Profile & settings',
                icon: <Settings className="h-4 w-4" />,
                onSelect: () => navigate('/settings'),
              },
              {
                label: 'Sign out',
                icon: <LogOut className="h-4 w-4" />,
                onSelect: () => void supabase.auth.signOut({ scope: 'local' }),
              },
            ]}
            trigger={(props) => (
              <button
                type="button"
                {...props}
                aria-label={`Account menu for ${name}`}
                className="rounded-full"
              >
                <Avatar name={name} color={avatarColor} size="sm" />
              </button>
            )}
          />
        </div>
      </div>
    </header>
  );
}
