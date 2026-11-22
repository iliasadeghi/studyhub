import { useCallback, useEffect, useRef, useState } from 'react';
import { formatDistanceToNowStrict } from 'date-fns';
import { toast } from '@/stores/uiStore';

/** Load data for an admin page, with reload and an error state. */
export function useAdminData<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setData(await loadRef.current());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, error, loading, reload, setData };
}

/** Run an admin action with a success toast; errors show as a toast. Returns true on success. */
export async function runAction(
  action: () => Promise<unknown>,
  success: string,
  description?: string,
): Promise<boolean> {
  try {
    await action();
    toast({ variant: 'success', title: success, description });
    return true;
  } catch (err) {
    toast({
      variant: 'error',
      title: "That didn't work",
      description: err instanceof Error ? err.message : 'Please try again.',
    });
    return false;
  }
}

export const ago = (iso: string | null | undefined, fallback = 'Never') =>
  iso ? `${formatDistanceToNowStrict(new Date(iso))} ago` : fallback;
