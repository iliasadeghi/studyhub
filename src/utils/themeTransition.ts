import { flushSync } from 'react-dom';
import { useSettingsStore } from '@/stores/settingsStore';

export interface Point {
  x: number;
  y: number;
}

/**
 * Switch between light and dark with a circle that expands from `origin`
 * (usually the center of the button that was clicked).
 * Falls back to an instant switch when the View Transitions API is missing
 * or the user prefers reduced motion.
 */
export function switchTheme(next: 'light' | 'dark', origin?: Point): void {
  const root = document.documentElement;
  const apply = () => {
    root.classList.toggle('dark', next === 'dark');
    // Render synchronously so the new snapshot includes React changes (e.g. the sun/moon icon).
    flushSync(() => useSettingsStore.getState().update({ theme: next }));
  };

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!document.startViewTransition || reduceMotion) {
    apply();
    return;
  }

  const x = origin?.x ?? window.innerWidth / 2;
  const y = origin?.y ?? window.innerHeight / 2;
  // Distance to the farthest corner, so the circle covers the whole screen.
  const radius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );

  // Freeze normal color transitions so the snapshot shows the final colors.
  root.classList.add('theme-switching');
  const transition = document.startViewTransition(apply);

  transition.ready
    .then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        {
          duration: 550,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          pseudoElement: '::view-transition-new(root)',
        },
      );
    })
    .catch(() => undefined);

  transition.finished.finally(() => root.classList.remove('theme-switching'));
}

/** Center of an element, for use as the reveal origin. */
export function centerOf(el: Element): Point {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}
