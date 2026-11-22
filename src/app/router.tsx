/* eslint-disable react-refresh/only-export-components -- route module, not hot-reloaded */
import { lazy, type ReactNode } from 'react';
import { createBrowserRouter, Navigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';
import { NotForAdmin, PublicOnly, RequireAdmin, RequireAuth } from '@/features/auth/guards';

const LoginPage = lazy(() => import('@/features/auth/LoginPage'));
const SignupPage = lazy(() => import('@/features/auth/SignupPage'));
const ForgotPasswordPage = lazy(() => import('@/features/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/features/auth/ResetPasswordPage'));
const OnboardingPage = lazy(() => import('@/features/onboarding/OnboardingPage'));
const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage'));
const TasksPage = lazy(() => import('@/features/tasks/TasksPage'));
const CalendarPage = lazy(() => import('@/features/calendar/CalendarPage'));
const ClassesPage = lazy(() => import('@/features/classes/ClassesPage'));
const ClassDetailPage = lazy(() => import('@/features/classes/ClassDetailPage'));
const NotesPage = lazy(() => import('@/features/notes/NotesPage'));
const PeoplePage = lazy(() => import('@/features/teachers/TeachersPage'));
const MessagesPage = lazy(() => import('@/features/messages/MessagesPage'));
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage'));
const NotFoundPage = lazy(() => import('@/features/NotFoundPage'));
const AdminOverviewPage = lazy(() => import('@/features/admin/AdminOverviewPage'));
const AdminUsersPage = lazy(() => import('@/features/admin/AdminUsersPage'));
const AdminClassesPage = lazy(() => import('@/features/admin/AdminClassesPage'));
const AdminModerationPage = lazy(() => import('@/features/admin/AdminModerationPage'));
const AdminSchoolPage = lazy(() => import('@/features/admin/AdminSchoolPage'));
const AdminArchivePage = lazy(() => import('@/features/admin/AdminArchivePage'));
const AdminAuditPage = lazy(() => import('@/features/admin/AdminAuditPage'));

/** Student/teacher pages; the admin is sent to the admin console instead. */
const member = (page: ReactNode) => <NotForAdmin>{page}</NotForAdmin>;
const admin = (page: ReactNode) => <RequireAdmin>{page}</RequireAdmin>;

/** Old /teachers/:id links now open the conversation. */
function TeacherRedirect() {
  const { teacherId } = useParams();
  return <Navigate to={teacherId ? `/messages/${teacherId}` : '/people'} replace />;
}

export const router = createBrowserRouter(
  [
    {
      path: '/login',
      element: (
        <PublicOnly>
          <LoginPage />
        </PublicOnly>
      ),
    },
    {
      path: '/signup',
      element: (
        <PublicOnly>
          <SignupPage />
        </PublicOnly>
      ),
    },
    {
      path: '/forgot-password',
      element: (
        <PublicOnly>
          <ForgotPasswordPage />
        </PublicOnly>
      ),
    },
    { path: '/reset-password', element: <ResetPasswordPage /> },
    {
      path: '/welcome',
      element: (
        <RequireAuth allowUnonboarded>
          <OnboardingPage />
        </RequireAuth>
      ),
    },
    {
      path: '/',
      element: (
        <RequireAuth>
          <AppLayout />
        </RequireAuth>
      ),
      children: [
        { index: true, element: member(<DashboardPage />) },
        { path: 'tasks', element: member(<TasksPage />) },
        { path: 'calendar', element: member(<CalendarPage />) },
        { path: 'classes', element: member(<ClassesPage />) },
        { path: 'classes/:classId', element: member(<ClassDetailPage />) },
        { path: 'notes', element: member(<NotesPage />) },
        { path: 'notes/:noteId', element: member(<NotesPage />) },
        { path: 'people', element: member(<PeoplePage />) },
        { path: 'teachers', element: <Navigate to="/people" replace /> },
        { path: 'teachers/:teacherId', element: <TeacherRedirect /> },
        { path: 'messages', element: member(<MessagesPage />) },
        { path: 'messages/:contactId', element: member(<MessagesPage />) },
        { path: 'admin', element: admin(<AdminOverviewPage />) },
        { path: 'admin/users', element: admin(<AdminUsersPage />) },
        { path: 'admin/classes', element: admin(<AdminClassesPage />) },
        { path: 'admin/moderation', element: admin(<AdminModerationPage />) },
        { path: 'admin/school', element: admin(<AdminSchoolPage />) },
        { path: 'admin/archive', element: admin(<AdminArchivePage />) },
        { path: 'admin/audit', element: admin(<AdminAuditPage />) },
        { path: 'settings', element: <SettingsPage /> },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ],
  {
    // Works at the domain root locally and on Vercel.
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
