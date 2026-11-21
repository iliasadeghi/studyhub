/* eslint-disable react-refresh/only-export-components -- route module, not hot-reloaded */
import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';

const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage'));
const TasksPage = lazy(() => import('@/features/tasks/TasksPage'));
const CalendarPage = lazy(() => import('@/features/calendar/CalendarPage'));
const ClassesPage = lazy(() => import('@/features/classes/ClassesPage'));
const ClassDetailPage = lazy(() => import('@/features/classes/ClassDetailPage'));
const NotesPage = lazy(() => import('@/features/notes/NotesPage'));
const TeachersPage = lazy(() => import('@/features/teachers/TeachersPage'));
const TeacherDetailPage = lazy(() => import('@/features/teachers/TeacherDetailPage'));
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage'));
const OnboardingPage = lazy(() => import('@/features/onboarding/OnboardingPage'));
const NotFoundPage = lazy(() => import('@/features/NotFoundPage'));

export const router = createBrowserRouter(
  [
    { path: '/welcome', element: <OnboardingPage /> },
    {
      path: '/',
      element: <AppLayout />,
      children: [
        { index: true, element: <DashboardPage /> },
        { path: 'tasks', element: <TasksPage /> },
        { path: 'calendar', element: <CalendarPage /> },
        { path: 'classes', element: <ClassesPage /> },
        { path: 'classes/:classId', element: <ClassDetailPage /> },
        { path: 'notes', element: <NotesPage /> },
        { path: 'notes/:noteId', element: <NotesPage /> },
        { path: 'teachers', element: <TeachersPage /> },
        { path: 'teachers/:teacherId', element: <TeacherDetailPage /> },
        { path: 'settings', element: <SettingsPage /> },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ],
  {
    // Works at the domain root locally and under /<repo>/ on GitHub Pages.
    basename: import.meta.env.BASE_URL.replace(/\/$/, '') || '/',
    future: {
      v7_relativeSplatPath: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true,
    },
  },
);
