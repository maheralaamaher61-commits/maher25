import { useState, useEffect, useCallback } from 'react';
import { getDB } from '@/database/migrations';
import { seedDefaultCategories } from '@/database/db';

let initialized = false;

export function useDatabase() {
  const [ready, setReady] = useState(initialized);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialized) {
      setReady(true);
      return;
    }
    (async () => {
      try {
        await getDB();
        await seedDefaultCategories();
        initialized = true;
        setReady(true);
      } catch (e: any) {
        setError(e.message);
      }
    })();
  }, []);

  return { ready, error };
}

export function useRefresh<T>(fetcher: () => Promise<T>, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh, setData };
}
