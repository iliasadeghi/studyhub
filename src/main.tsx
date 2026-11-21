import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { router } from '@/app/router';
import { ThemeSync } from '@/app/ThemeSync';
import { Toaster } from '@/components/ui/Toaster';
import '@/styles/theme.css';
import '@/styles/markdown.css';
import '@/styles/print.css';

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <ThemeSync />
      <Suspense fallback={null}>
        <RouterProvider router={router} future={{ v7_startTransition: true }} />
      </Suspense>
      <Toaster />
    </MotionConfig>
  </StrictMode>,
);
