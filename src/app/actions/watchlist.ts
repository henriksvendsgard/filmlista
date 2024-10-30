"use server";

import { supabase } from "@/lib/supabaseClient";
import { revalidatePath } from "next/cache";

export async function toggleWatchedStatus(movieId: number): Promise<{ success: boolean; watched?: boolean; error?: string }> {
	try {
		const { data, error } = await supabase.from("Watchlist").select("watched").eq("movie_id", movieId).single();

		if (error) throw error;

		const newWatchedStatus = !data.watched;

		const { error: updateError } = await supabase.from("Watchlist").update({ watched: newWatchedStatus }).eq("movie_id", movieId);

		if (updateError) throw updateError;

		revalidatePath("/watchlist");
		return { success: true, watched: newWatchedStatus };
	} catch (error) {
		console.error("Error toggling watched status:", error);
		return { success: false, error: "Failed to update watched status" };
	}
}

export async function checkWatchlistStatus(movie_id: string) {
	const { data, error } = await supabase.from("Watchlist").select("id").eq("movie_id", movie_id).single();

	if (error && error.code !== "PGRST116") {
		console.error("Error checking watchlist:", error);
		throw new Error("An error occurred while checking the watchlist");
	}

	return !!data;
}

export async function addToWatchlist({ user_id, movie_id, title, poster_path }: { user_id?: string; movie_id: string; title: string; poster_path: string }) {
	const { error } = await supabase.from("Watchlist").insert([{ user_id, movie_id, title, poster_path }]);

	if (error) {
		console.error("Error adding to watchlist:", error);
		throw new Error("An error occurred while adding to the watchlist");
	}

	revalidatePath("/movies/[id]", "page");
	return { success: true, message: "Added to watchlist" };
}

export async function removeFromWatchlist({ user_id, movie_id }: { user_id?: string; movie_id: string }) {
	const { error } = await supabase.from("Watchlist").delete().eq("user_id", user_id).eq("movie_id", movie_id);

	if (error) {
		console.error("Error removing from watchlist:", error);
		throw new Error("An error occurred while removing from the watchlist");
	}

	revalidatePath("/movies/[id]", "page");
	return { success: true, message: "Removed from watchlist" };
}
