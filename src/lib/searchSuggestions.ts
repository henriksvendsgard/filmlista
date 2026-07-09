export type SearchSuggestion = {
    id: number;
    title: string;
    name?: string;
    poster_path: string;
    release_date?: string;
    first_air_date?: string;
    media_type: "movie" | "tv";
};

export async function fetchSearchSuggestions(
    query: string,
    signal?: AbortSignal
): Promise<SearchSuggestion[]> {
    const params = new URLSearchParams({
        query,
        language: "no-NO",
        page: "1",
        include_adult: "false",
    });

    const response = await fetch(`/api/tmdb/search/multi?${params.toString()}`, { signal });

    if (!response.ok) {
        throw new Error("Failed to fetch search suggestions");
    }

    const data = await response.json();

    return (
        data.results
            ?.filter(
                (result: { media_type?: string; poster_path?: string | null }) =>
                    (result.media_type === "movie" || result.media_type === "tv") && result.poster_path
            )
            .slice(0, 5) ?? []
    );
}
