"use server";

import { createClient } from "@/utils/supabase/client";
import { revalidatePath } from "next/cache";

/**
 *
 * @param movieId
 * @returns { success: boolean, watched?: boolean, error?: string }
 */
export async function toggleWatchedStatus(
    movieId: number
): Promise<{ success: boolean; watched?: boolean; error?: string }> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase.from("watchlist").select("watched").eq("movie_id", movieId).single();

        if (error) throw error;

        const newWatchedStatus = !data.watched;

        const { error: updateError } = await supabase
            .from("watchlist")
            .update({ watched: newWatchedStatus })
            .eq("movie_id", movieId);

        if (updateError) throw updateError;

        revalidatePath("/watchlist");
        return { success: true, watched: newWatchedStatus };
    } catch (error) {
        console.error("Error toggling watched status:", error);
        return { success: false, error: "Failed to update watched status" };
    }
}

/**
 *
 * @param movie_id
 * @returns isInWatchlist: boolean, addedByUser: string | null
 */
export async function checkWatchlistStatus(movie_id: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("watchlist")
        .select("id, user_id") // Henter ut id og user_id for å kunne vise hvem som la til filmen
        .eq("movie_id", movie_id)
        .single();

    if (error && error.code !== "PGRST116") {
        console.error("Error checking watchlist:", error);
        throw new Error("An error occurred while checking the watchlist");
    }

    // Returnerer et objekt med to properties: isInWatchlist og addedByUser
    return {
        isInWatchlist: !!data,
        addedByUser: data?.user_id || null,
    };
}

/**
 *
 * @param user_id
 * @param movie_id
 * @param title
 * @param poster_path
 * @returns { success: boolean, message: string }
 */
export async function addToWatchlist({
    user_id,
    movie_id,
    title,
    poster_path,
}: {
    user_id?: string;
    movie_id: string;
    title: string;
    poster_path: string;
}) {
    const supabase = await createClient();
    const { error } = await supabase.from("watchlist").insert([{ user_id, movie_id, title, poster_path }]);

    if (error) {
        console.error("Error adding to watchlist:", error);
        throw new Error("An error occurred while adding to the watchlist");
    }

    revalidatePath("/movies/[id]", "page");
    return { success: true, message: "Added to watchlist" };
}

/**
 *
 * @param user_id
 * @param movie_id
 * @returns { success: boolean, message: string }
 */
export async function removeFromWatchlist({ user_id, movie_id }: { user_id?: string; movie_id: string }) {
    const supabase = await createClient();
    const { error } = await supabase.from("watchlist").delete().eq("user_id", user_id).eq("movie_id", movie_id);

    if (error) {
        console.error("Error removing from watchlist:", error);
        throw new Error("An error occurred while removing from the watchlist");
    }

    revalidatePath("/movies/[id]", "page");
    return { success: true, message: "Removed from watchlist" };
}
