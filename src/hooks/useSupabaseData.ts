import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

interface SupabaseQueryOptions {
  table: string;
  filter?: { [key: string]: any };
  orderBy?: { column: string; ascending: boolean };
}

export function useSupabaseData<T>({ table, filter, orderBy }: SupabaseQueryOptions) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        let query = supabase.from(table).select('*');

        if (filter) {
          for (const key in filter) {
            query = query.eq(key, filter[key]);
          }
        }

        if (orderBy) {
          query = query.order(orderBy.column, { ascending: orderBy.ascending });
        }

        const { data, error } = await query;

        if (error) throw error;
        setData(data as T[]);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [table, JSON.stringify(filter), JSON.stringify(orderBy)]);

  return { data, loading, error };
}
