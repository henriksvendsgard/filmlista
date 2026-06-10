import { getLists, ListsResult } from "@/lib/listRepository";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useState, useEffect } from "react";

export function useMovieLists() {
    const [lists, setLists] = useState<ListsResult>({ owned: [], shared: [] });
    const supabase = createClientComponentClient();

    useEffect(() => {
        const fetchLists = async () => {
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();
            if (userError || !user) return;

            try {
                const result = await getLists(supabase, user.id);
                setLists(result);
            } catch (error) {
                console.error("Error fetching lists:", error);
            }
        };

        fetchLists();
    }, [supabase]);

    return { lists };
}
