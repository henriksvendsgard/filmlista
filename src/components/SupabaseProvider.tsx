"use client";

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";

type SupabaseContext = {
    supabase: SupabaseClient;
    user: User | null;
};

const Context = createContext<SupabaseContext | undefined>(undefined);

export default function SupabaseProvider({
    children,
    initialUser,
}: {
    children: React.ReactNode;
    initialUser: User | null;
}) {
    const supabase = useMemo(() => createClient(), []);
    const router = useRouter();
    const [user, setUser] = useState<User | null>(initialUser);

    useEffect(() => {
        setUser(initialUser);

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === "SIGNED_OUT") {
                setUser(null);
                router.push("/login");
            } else if (event === "SIGNED_IN" || event === "USER_UPDATED") {
                if (session?.user) {
                    setUser(session.user);
                }
                router.refresh();
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [supabase, router, initialUser]);

    return <Context.Provider value={{ supabase, user }}>{children}</Context.Provider>;
}

export const useSupabase = () => {
    const context = useContext(Context);
    if (context === undefined) {
        throw new Error("useSupabase must be used inside SupabaseProvider");
    }
    return context;
};
