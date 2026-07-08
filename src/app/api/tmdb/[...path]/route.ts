import { fetchTmdb } from "@/lib/tmdb/fetch";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const { path } = await params;
    const pathname = `/${path.join("/")}`;
    const search = request.nextUrl.search;

    try {
        const data = await fetchTmdb(`${pathname}${search}`);
        return NextResponse.json(data);
    } catch (error) {
        console.error("TMDB proxy error:", error);
        return NextResponse.json({ error: "Failed to fetch from TMDB" }, { status: 502 });
    }
}
