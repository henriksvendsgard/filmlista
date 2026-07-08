const TMDB_BASE_URL = "https://api.themoviedb.org/3";

function getTmdbApiKey(): string {
    const key = process.env.TMDB_API_KEY ?? process.env.NEXT_PUBLIC_TMDB_API_KEY;
    if (!key) {
        throw new Error("TMDB API key is not configured");
    }
    return key;
}

export async function fetchTmdb<T>(path: string, init?: RequestInit & { revalidate?: number }): Promise<T> {
    const url = path.startsWith("http") ? path : `${TMDB_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
    const { revalidate = 60 * 60 * 24, ...fetchInit } = init ?? {};

    const response = await fetch(url, {
        ...fetchInit,
        headers: {
            accept: "application/json",
            Authorization: `Bearer ${getTmdbApiKey()}`,
            ...fetchInit.headers,
        },
        next: { revalidate },
    });

    if (!response.ok) {
        throw new Error(`TMDB request failed: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
}
