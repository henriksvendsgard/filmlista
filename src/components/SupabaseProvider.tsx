"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import type { SupabaseClient, User } from "@supabase/auth-helpers-nextjs";

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
    const supabase = createClientComponentClient();
    const router = useRouter();
    const [user, setUser] = useState<User | null>(initialUser);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Set initial user state
        setUser(initialUser);
        setIsLoading(false);

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

    if (isLoading) {
        return null; // or a loading spinner
    }

    return <Context.Provider value={{ supabase, user }}>{children}</Context.Provider>;
}

export const useSupabase = () => {
    const context = useContext(Context);
    if (context === undefined) {
        throw new Error("useSupabase must be used inside SupabaseProvider");
    }
    return context;
};
