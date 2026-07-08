import { fetchTmdb } from "@/lib/tmdb/fetch";
import { TMDBTVShow } from "@/types/tvshow";

export async function getTVShowPageData(id: string): Promise<TMDBTVShow> {
    const [show, credits, providers] = await Promise.all([
        fetchTmdb<TMDBTVShow>(`/tv/${id}?language=no-NO`),
        fetchTmdb<{ cast: TMDBTVShow["cast"] }>(`/tv/${id}/credits`),
        fetchTmdb<{ results?: { NO?: TMDBTVShow["watch_providers"] } }>(`/tv/${id}/watch/providers`),
    ]);

    return {
        ...show,
        cast: credits.cast?.slice(0, 6) ?? [],
        watch_providers: providers.results?.NO ?? null,
    };
}
