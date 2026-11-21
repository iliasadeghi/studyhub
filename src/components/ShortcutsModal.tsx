import { useUIStore } from '@/stores/uiStore';
import { NAV_ITEMS } from '@/layouts/nav';
import { Modal } from './ui/Modal';
import { Kbd } from './ui/Misc';

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
const MOD = isMac ? '⌘' : 'Ctrl';

const GROUPS: { title: string; items: { keys: string[]; label: string }[] }[] = [
  {
    title: 'General',
    items: [
      { keys: [MOD, 'K'], label: 'Open command palette' },
      { keys: ['/'], label: 'Search' },
      { keys: ['N'], label: 'New task' },
      { keys: ['?'], label: 'Show keyboard shortcuts' },
      { keys: ['Esc'], label: 'Close dialog' },
    ],
  },
  {
    title: 'Navigation',
    items: NAV_ITEMS.map((n, i) => ({ keys: [String(i + 1)], label: `Go to ${n.label}` })),
  },
  {
    title: 'Lists & boards',
    items: [
      { keys: ['←', '→'], label: 'Switch tabs (when focused)' },
      { keys: ['Space'], label: 'Pick up / drop a card while dragging' },
      { keys: ['↑', '↓', '←', '→'], label: 'Move a picked-up card' },
    ],
  },
];

export function ShortcutsModal() {
  const open = useUIStore((s) => s.shortcutsOpen);
  const setOpen = useUIStore((s) => s.setShortcutsOpen);
  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      title="Keyboard shortcuts"
      description="Work faster without leaving the keyboard."
      size="md"
    >
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {GROUPS.map((g) => (
          <section
            key={g.title}
            className={g.title === 'Lists & boards' ? 'sm:col-span-2' : undefined}
          >
            <h3 className="mb-2 text-xs font-bold tracking-wide text-muted uppercase">{g.title}</h3>
            <ul className="divide-y divide-border">
              {g.items.map((it) => (
                <li key={it.label} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span>{it.label}</span>
                  <span className="flex shrink-0 gap-1">
                    {it.keys.map((k) => (
                      <Kbd key={k}>{k}</Kbd>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Modal>
  );
}
