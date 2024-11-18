import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useState, useEffect } from 'react';

export function useMovieLists() {
    const [lists, setLists] = useState<{
      owned: any[];
      shared: any[];
    }>({ owned: [], shared: [] });

    const supabase = createClientComponentClient();
  
    useEffect(() => {
        const fetchLists = async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
    
          try {
            const { data: sharedListIds, error: sharedError } = await supabase
              .from('shared_lists')
              .select('list_id')
              .eq('user_id', user.id);  // Changed from shared_with to user_id
    
            if (sharedError) throw sharedError;
    
            const { data: allLists, error: listsError } = await supabase
              .from('lists')
              .select('*');
    
            if (listsError) throw listsError;
    
            const sharedListIdsArray = (sharedListIds || []).map(item => item.list_id);
    
            const ownedLists = allLists.filter(list => list.owner_id === user.id);
            const sharedLists = allLists.filter(list => sharedListIdsArray.includes(list.id));
    
            setLists({
              owned: ownedLists || [],
              shared: sharedLists || []
            });
          } catch (error) {
            console.error('Error fetching lists:', error);
          }
        };
    
        fetchLists();
      }, []);
    
      return { lists };
    }