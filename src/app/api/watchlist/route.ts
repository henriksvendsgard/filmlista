import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const movie_id = searchParams.get("movie_id");
	const list_id = searchParams.get("list_id");

	if (!movie_id || !list_id) {
		return NextResponse.json({ error: "Missing movie_id or list_id" }, { status: 400 });
	}

	const { data, error } = await supabase.from("movies").select("id").eq("movie_id", movie_id).eq("list_id", list_id).single();

	if (error && error.code !== "PGRST116") {
		console.error("Error checking movie:", error);
		return NextResponse.json({ error: "An error occurred while checking the movie" }, { status: 500 });
	}

	return NextResponse.json({ isInList: !!data });
}

export async function POST(request: Request) {
	const { list_id, movie_id, title, poster_path } = await request.json();

	const { data, error } = await supabase.from("movies").insert([{ list_id, movie_id, title, poster_path }]).select();

	if (error) {
		console.error("Error adding movie to list:", error);
		return NextResponse.json({ error: "An error occurred while adding the movie to the list" }, { status: 500 });
	}

	return NextResponse.json({ data });
}

export async function DELETE(request: Request) {
	const { list_id, movie_id } = await request.json();

	const { error } = await supabase.from("movies").delete().eq("list_id", list_id).eq("movie_id", movie_id);

	if (error) {
		console.error("Error removing movie from list:", error);
		return NextResponse.json({ error: "An error occurred while removing the movie from the list" }, { status: 500 });
	}

	return NextResponse.json({ success: true });
}
