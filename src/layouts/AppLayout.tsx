import { Suspense } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { GlobalUI } from '@/components/GlobalUI';
import { ReminderBanner } from '@/components/ReminderBanner';
import { PageSkeleton } from '@/components/ui/Misc';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileNav } from './MobileNav';

function AnimatedOutlet() {
  const location = useLocation();
  const outlet = useOutlet();
  // Key by top-level section so tab/sub-route changes don't replay the page transition.
  const section = location.pathname.split('/')[1] ?? '';
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={section}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <ErrorBoundary>
          <Suspense fallback={<PageSkeleton />}>{outlet}</Suspense>
        </ErrorBoundary>
      </motion.div>
    </AnimatePresence>
  );
}

export function AppLayout() {
  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only z-[70] rounded-md bg-accent px-4 py-2 font-semibold text-accent-fg focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <Sidebar />
      <div className="md:pl-[72px] lg:pl-[248px] print:!pl-0">
        <Topbar />
        <ReminderBanner />
        <main
          id="main"
          tabIndex={-1}
          className="mx-auto max-w-[1200px] px-4 pt-6 pb-28 focus:outline-none sm:px-6 md:pb-12 lg:px-8"
        >
          <AnimatedOutlet />
        </main>
      </div>
      <MobileNav />
      <GlobalUI />
    </div>
  );
}
