import { fetchTmdb } from "@/lib/tmdb/fetch";

export interface MoviePageData {
    movie: {
        id: number;
        title: string;
        overview: string;
        poster_path: string | null;
        backdrop_path: string | null;
        release_date: string;
        vote_average: number;
        runtime: number | null;
        genres: { id: number; name: string }[];
    };
    cast: {
        id: number;
        name: string;
        character: string;
        profile_path: string | null;
    }[];
    watchProviders: {
        rent?: { provider_name: string; logo_path: string }[];
        buy?: { provider_name: string; logo_path: string }[];
        flatrate?: { provider_name: string; logo_path: string }[];
    } | null;
    similarMovies: {
        id: number;
        title: string;
        poster_path: string | null;
        vote_average: number;
        release_date: string;
    }[];
}

export async function getMoviePageData(id: string): Promise<MoviePageData> {
    const [movie, credits, providers] = await Promise.all([
        fetchTmdb<MoviePageData["movie"]>(`/movie/${id}?language=no-NO`),
        fetchTmdb<{ cast: MoviePageData["cast"] }>(`/movie/${id}/credits`),
        fetchTmdb<{ results?: { NO?: MoviePageData["watchProviders"] } }>(`/movie/${id}/watch/providers`),
    ]);

    const genreIds = movie.genres?.map((g) => g.id).join(",") ?? "";
    const similarPages = genreIds
        ? await Promise.all(
              [1, 2, 3].map((page) =>
                  fetchTmdb<{ results: MoviePageData["similarMovies"] }>(
                      `/discover/movie?with_genres=${genreIds}&sort_by=popularity.desc&page=${page}&without_genres=99,10755`
                  )
              )
          )
        : [];

    const similarMovies = similarPages
        .flatMap((page) => page.results)
        .filter((item) => item.id !== movie.id && item.poster_path)
        .slice(0, 50);

    return {
        movie,
        cast: credits.cast?.slice(0, 6) ?? [],
        watchProviders: providers.results?.NO ?? null,
        similarMovies,
    };
}
