import { toast } from './uiStore';

interface Result {
  error: { message: string } | null;
}

/**
 * Run a server write after an optimistic local update. If it fails, undo the
 * local change and tell the user. Returns true on success.
 */
export async function remote(
  op: PromiseLike<Result>,
  rollback: () => void,
  action: string,
): Promise<boolean> {
  try {
    const { error } = await op;
    if (!error) return true;
    rollback();
    toast({ variant: 'error', title: `Couldn't ${action}`, description: error.message });
  } catch (err) {
    rollback();
    toast({
      variant: 'error',
      title: `Couldn't ${action}`,
      description: err instanceof Error ? err.message : 'Check your connection and try again.',
    });
  }
  return false;
}

/** Throw on a Supabase error so callers can use try/catch. */
export function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

export const newId = (): string => crypto.randomUUID();
