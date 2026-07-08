import { getLists, ListsResult } from "@/lib/listRepository";
import { useSupabase } from "@/components/SupabaseProvider";
import { useEffect, useState } from "react";

export function useMovieLists() {
    const [lists, setLists] = useState<ListsResult>({ owned: [], shared: [] });
    const { supabase, user } = useSupabase();

    useEffect(() => {
        const fetchLists = async () => {
            if (!user) return;

            try {
                const result = await getLists(supabase, user.id);
                setLists(result);
            } catch (error) {
                console.error("Error fetching lists:", error);
            }
        };

        fetchLists();
    }, [supabase, user]);

    return { lists };
}
