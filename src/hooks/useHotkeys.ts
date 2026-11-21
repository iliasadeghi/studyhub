import { useEffect, useRef } from 'react';

export type HotkeyMap = Record<string, (e: KeyboardEvent) => void>;

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}

/**
 * Register global keyboard shortcuts.
 * Keys: "n", "?", "mod+k" (Ctrl on Windows/Linux, Cmd on macOS), "g d" style is not supported.
 * Plain-key shortcuts are ignored while typing in a field; "mod+" shortcuts always fire.
 */
export function useHotkeys(map: HotkeyMap, enabled = true): void {
  const ref = useRef(map);
  useEffect(() => {
    ref.current = map;
  });

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();
      for (const [combo, handler] of Object.entries(ref.current)) {
        const wantsMod = combo.startsWith('mod+');
        const target = wantsMod ? combo.slice(4) : combo;
        if (wantsMod !== mod) continue;
        if (!wantsMod && (e.altKey || isTypingTarget(e.target))) continue;
        if (target === key || target === e.key) {
          e.preventDefault();
          handler(e);
          return;
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled]);
}
