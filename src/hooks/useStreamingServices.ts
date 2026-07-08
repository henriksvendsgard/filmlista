"use client";

import { useSupabase } from "@/components/SupabaseProvider";
import { useCallback, useEffect, useState } from "react";

export function useStreamingServices() {
    const { supabase, user } = useSupabase();
    const [services, setServices] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchServices = useCallback(async () => {
        if (!user) {
            setServices([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("streaming_services")
                .eq("id", user.id)
                .single();

            if (error) throw error;
            setServices(data?.streaming_services ?? []);
        } catch (error) {
            console.error("Error fetching streaming services:", error);
            setServices([]);
        } finally {
            setIsLoading(false);
        }
    }, [supabase, user]);

    const saveServices = useCallback(
        async (newServices: number[]) => {
            if (!user) return false;

            const { error } = await supabase
                .from("profiles")
                .update({ streaming_services: newServices })
                .eq("id", user.id);

            if (error) {
                console.error("Error saving streaming services:", error);
                return false;
            }

            setServices(newServices);
            return true;
        },
        [supabase, user]
    );

    useEffect(() => {
        fetchServices();
    }, [fetchServices]);

    return {
        services,
        isLoading,
        saveServices,
        refetch: fetchServices,
        hasServices: services.length > 0,
    };
}
