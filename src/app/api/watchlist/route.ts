import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function GET(request: Request, res: Response) {
	const { searchParams } = new URL(request.url);
	const movie_id = searchParams.get("movie_id");

	if (!movie_id) {
		return NextResponse.json({ error: "Missing movie_id or user_id" }, { status: 400 });
	}

	const { data, error } = await supabase.from("Watchlist").select("id").eq("movie_id", movie_id).single();

	if (error && error.code !== "PGRST116") {
		console.error("Error checking watchlist:", error);
		return NextResponse.json({ error: "An error occurred while checking the watchlist" }, { status: 500 });
	}

	return NextResponse.json({ isInWatchlist: !!data });
}

export async function POST(request: Request) {
	const { user_id, movie_id, title, poster_path } = await request.json();

	const { data, error } = await supabase.from("Watchlist").insert([{ user_id, movie_id, title, poster_path }]).select();

	if (error) {
		console.error("Error adding to watchlist:", error);
		return NextResponse.json({ error: "An error occurred while adding to the watchlist" }, { status: 500 });
	}

	return NextResponse.json({ data });
}

export async function DELETE(request: Request) {
	const { user_id, movie_id } = await request.json();

	const { error } = await supabase.from("Watchlist").delete().eq("user_id", user_id).eq("movie_id", movie_id);

	if (error) {
		console.error("Error removing from watchlist:", error);
		return NextResponse.json({ error: "An error occurred while removing from the watchlist" }, { status: 500 });
	}

	return NextResponse.json({ success: true });
}
