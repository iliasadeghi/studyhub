import { useState } from 'react';
import {
  Archive,
  ArchiveRestore,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  KeyRound,
  ShieldOff,
  Trash2,
  UserCheck,
} from 'lucide-react';
import { adminService, type AdminUser } from '@/services/admin';
import type { MenuItem } from '@/components/ui/Menu';
import { runAction } from './adminHooks';
import { ConfirmModal } from './shared';

type Pending = {
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  run: () => Promise<unknown>;
  success: string;
};

/**
 * Admin actions for one account, as menu items, plus the confirmation dialog
 * they open. `onDone` reloads the page data after a change.
 */
export function useUserActions(onDone: () => void) {
  const [pending, setPending] = useState<Pending | null>(null);

  const act = async (run: () => Promise<unknown>, success: string) => {
    if (await runAction(run, success)) onDone();
  };

  const itemsFor = (u: AdminUser): MenuItem[] => {
    if (u.role === 'admin') return [];
    const items: MenuItem[] = [];
    if (u.archivedAt) {
      items.push({
        label: 'Restore account',
        icon: <ArchiveRestore className="h-4 w-4" />,
        onSelect: () => void act(() => adminService.archiveUser(u.id, false), `${u.name} restored`),
      });
      items.push({
        label: 'Delete permanently',
        icon: <Trash2 className="h-4 w-4" />,
        danger: true,
        onSelect: () =>
          setPending({
            title: `Delete ${u.name}?`,
            body: `This permanently deletes ${u.email} and everything in the account: tasks, notes, messages and bookings. It can't be undone.`,
            confirmLabel: 'Delete permanently',
            danger: true,
            run: () => adminService.deleteUser(u.id),
            success: `${u.name} deleted`,
          }),
      });
      return items;
    }
    if (u.status === 'pending') {
      items.push({
        label: 'Approve teacher',
        icon: <UserCheck className="h-4 w-4" />,
        onSelect: () =>
          void act(() => adminService.setStatus(u.id, 'active'), `${u.name} approved`),
      });
    }
    if (u.status === 'suspended') {
      items.push({
        label: 'Reactivate',
        icon: <CheckCircle2 className="h-4 w-4" />,
        onSelect: () =>
          void act(() => adminService.setStatus(u.id, 'active'), `${u.name} reactivated`),
      });
    } else {
      items.push({
        label: 'Suspend',
        icon: <ShieldOff className="h-4 w-4" />,
        danger: true,
        onSelect: () =>
          setPending({
            title: `Suspend ${u.name}?`,
            body: 'They are signed out of everything right away and see an "account suspended" screen until you reactivate them. Nothing is deleted.',
            confirmLabel: 'Suspend',
            danger: true,
            run: () => adminService.setStatus(u.id, 'suspended'),
            success: `${u.name} suspended`,
          }),
      });
    }
    items.push(
      u.role === 'student'
        ? {
            label: 'Change role to teacher',
            icon: <BookOpen className="h-4 w-4" />,
            onSelect: () =>
              setPending({
                title: `Make ${u.name} a teacher?`,
                body: 'They will be removed from the classes they joined as a student and will be able to create classes.',
                confirmLabel: 'Make teacher',
                run: () => adminService.setRole(u.id, 'teacher'),
                success: `${u.name} is now a teacher`,
              }),
          }
        : {
            label: 'Change role to student',
            icon: <GraduationCap className="h-4 w-4" />,
            onSelect: () =>
              setPending({
                title: `Make ${u.name} a student?`,
                body: 'Their classes must be reassigned to another teacher first.',
                confirmLabel: 'Make student',
                run: () => adminService.setRole(u.id, 'student'),
                success: `${u.name} is now a student`,
              }),
          },
    );
    items.push({
      label: 'Send password-reset email',
      icon: <KeyRound className="h-4 w-4" />,
      onSelect: () =>
        setPending({
          title: 'Send a password-reset email?',
          body: `${u.email} will get a link to choose a new password. You never see or set their password.`,
          confirmLabel: 'Send email',
          run: () => adminService.sendPasswordReset(u),
          success: 'Password-reset email sent',
        }),
    });
    items.push({
      label: 'Archive account',
      icon: <Archive className="h-4 w-4" />,
      danger: true,
      onSelect: () =>
        setPending({
          title: `Archive ${u.name}?`,
          body: 'Archived accounts can’t sign in to the app and are moved to the Archive, where you can restore them or delete them permanently.',
          confirmLabel: 'Archive',
          danger: true,
          run: () => adminService.archiveUser(u.id, true),
          success: `${u.name} archived`,
        }),
    });
    return items;
  };

  const dialog = (
    <ConfirmModal
      open={pending !== null}
      title={pending?.title ?? ''}
      body={pending?.body ?? ''}
      confirmLabel={pending?.confirmLabel ?? 'Confirm'}
      danger={pending?.danger}
      onClose={() => setPending(null)}
      onConfirm={() => (pending ? act(pending.run, pending.success) : undefined)}
    />
  );

  return { itemsFor, dialog };
}
