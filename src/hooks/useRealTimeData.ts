import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

type TableName = 'projects' | 'project_modules' | 'users' | 'project_members' | 'roles';

export function useRealTimeData<T>(
  table: TableName,
  initialData: T[] = [],
  filter?: { column: string; value: any }
) {
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    // Create realtime subscription
    const realtimeChannel = supabase
      .channel(`${table}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter: filter ? `${filter.column}=eq.${filter.value}` : undefined
        },
        (payload) => {
          console.log(`Real-time update for ${table}:`, payload);
          
          switch (payload.eventType) {
            case 'INSERT':
              setData(prev => [...prev, payload.new as T]);
              break;
            case 'UPDATE':
              setData(prev => prev.map(item => 
                (item as any).id === payload.new.id ? payload.new as T : item
              ));
              break;
            case 'DELETE':
              setData(prev => prev.filter(item => 
                (item as any).id !== payload.old.id
              ));
              break;
          }
        }
      )
      .subscribe();

    setChannel(realtimeChannel);

    return () => {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [table, filter?.column, filter?.value]);

  const refreshData = async () => {
    setLoading(true);
    try {
      let query = supabase.from(table).select('*');
      
      if (filter) {
        query = query.eq(filter.column, filter.value);
      }
      
      const { data: fetchedData, error } = await query;
      
      if (error) throw error;
      setData(fetchedData as any || []);
    } catch (error) {
      console.error(`Error fetching ${table}:`, error);
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    refreshData,
    setData
  };
}