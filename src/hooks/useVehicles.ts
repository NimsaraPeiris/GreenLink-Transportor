import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Vehicle {
  id: number;
  transporter_id: string;
  plate_number: string;
  model: string;
  capacity: number;
  created_at: string;
}

export function useVehicles(transporterId?: string) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchVehicles = async () => {
      setLoading(true);
      setError(null);

      try {
        let query = supabase.from('vehicles').select('*');
        
        if (transporterId) {
          query = query.eq('transporter_id', transporterId);
        }

        const { data, error } = await query;

        if (error) throw error;
        setVehicles(data || []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, [transporterId]);

  return { vehicles, loading, error };
}
