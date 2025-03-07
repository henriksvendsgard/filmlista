import { TMDBTVShow } from "@/types/tvshow";
import { SearchResults } from "./typings";

interface BaseShow {
    id: number;
    popularity: number;
    poster_path: string | null;
    backdrop_path: string | null;
    vote_average: number;
    vote_count: number;
    overview: string;
}

interface TVShowResult extends BaseShow {
    origin_country?: string[];
    name: string;
    first_air_date: string;
}

interface TVShowSearchResults {
    page: number;
    results: TVShowResult[];
    total_pages: number;
    total_results: number;
}

async function fetchFromTMDB(url: URL, page = 1, region?: string): Promise<TVShowSearchResults> {
    url.searchParams.set("include_adult", "false");
    url.searchParams.set("include_video", "false");
    url.searchParams.set("language", "no-NO");
    url.searchParams.set("page", page.toString());
    url.searchParams.set("include_null_first_air_dates", "false");
    url.searchParams.set("without_null_poster_path", "true");
    if (region) {
        url.searchParams.set("region", region);
    }

    const options: RequestInit = {
        method: "GET",
        headers: {
            accept: "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_TMDB_API_KEY}`,
        },
        next: {
            revalidate: 60 * 60 * 24,
        },
    };

    const response = await fetch(url.toString(), options);
    const data = await response.json();

    // Transform the raw data into our TVShowResult format
    const results: TVShowResult[] = data.results
        .map((show: any) => ({
            id: show.id,
            popularity: show.popularity,
            poster_path: show.poster_path,
            backdrop_path: show.backdrop_path,
            vote_average: show.vote_average,
            vote_count: show.vote_count,
            overview: show.overview,
            name: show.name,
            first_air_date: show.first_air_date,
            origin_country: show.origin_country,
        }))
        .filter((show: TVShowResult) => show.poster_path !== null);

    return {
        page: data.page,
        results,
        total_pages: data.total_pages,
        total_results: data.total_results,
    };
}

async function fetchTVShowFromTMDB(url: URL) {
    // First try Norwegian
    url.searchParams.set("language", "no-NO");

    const options: RequestInit = {
        method: "GET",
        headers: {
            accept: "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_TMDB_API_KEY}`,
        },
        next: {
            revalidate: 60 * 60 * 24,
        },
    };

    const response = await fetch(url.toString(), options);
    const norwegianShow = await response.json();

    // If no Norwegian overview, fetch English
    if (!norwegianShow.overview) {
        url.searchParams.set("language", "en-US");
        const englishResponse = await fetch(url.toString(), options);
        const englishShow = await englishResponse.json();

        // Merge English overview with Norwegian data if needed
        norwegianShow.overview = englishShow.overview;
    }

    return norwegianShow;
}

export async function getPopularTVShows(page = 1) {
    const url = new URL("https://api.themoviedb.org/3/tv/popular");
    url.searchParams.set("vote_count.gte", "50"); // Lower minimum votes for newer shows
    url.searchParams.set("vote_average.gte", "6.5"); // Slightly lower rating threshold
    url.searchParams.set("region", "NO"); // Specifically get shows popular in Norway

    // Get shows from the last 2 years for recent content
    const today = new Date();
    const twoYearsAgo = new Date(today.getFullYear() - 2, today.getMonth(), today.getDate())
        .toISOString()
        .split("T")[0];

    // Fetch both recent and all-time popular shows in Norway
    const [recentNorwegianData, allTimeNorwegianData] = (await Promise.all([
        fetchFromTMDB(new URL("https://api.themoviedb.org/3/tv/popular"), page, "NO"),
        fetchFromTMDB(new URL("https://api.themoviedb.org/3/discover/tv"), page, "NO"),
    ])) as [TVShowSearchResults, TVShowSearchResults];

    // Also fetch Norwegian TV shows specifically
    const norwegianShowsUrl = new URL("https://api.themoviedb.org/3/discover/tv");
    norwegianShowsUrl.searchParams.set("with_origin_country", "NO");
    norwegianShowsUrl.searchParams.set("sort_by", "popularity.desc");

    const norwegianShows = (await fetchFromTMDB(norwegianShowsUrl, page)) as TVShowSearchResults;

    // Combine and deduplicate results based on show ID
    const combinedResults: TVShowResult[] = [];
    const seenIds = new Set<number>();

    // Helper function to add shows if not already included
    const addUniqueShows = (shows: TVShowResult[]) => {
        for (const show of shows) {
            if (!seenIds.has(show.id)) {
                combinedResults.push(show);
                seenIds.add(show.id);
            }
        }
    };

    // First add Norwegian shows
    addUniqueShows(norwegianShows.results);

    // Then add shows popular in Norway
    addUniqueShows(recentNorwegianData.results);
    addUniqueShows(allTimeNorwegianData.results);

    // Sort shows by a combination of factors
    combinedResults.sort((a, b) => {
        const isANorwegian = a.origin_country?.includes("NO") ?? false;
        const isBNorwegian = b.origin_country?.includes("NO") ?? false;

        // Calculate a score for each show based on multiple factors
        const getScore = (show: TVShowResult, isNorwegian: boolean) => {
            const popularityScore = show.popularity / 100; // Normalize popularity
            const dateScore = show.first_air_date
                ? (new Date(show.first_air_date).getTime() - new Date(twoYearsAgo).getTime()) /
                  (1000 * 60 * 60 * 24 * 365)
                : 0; // Years since two years ago
            const norwegianBonus = isNorwegian ? 3 : 0; // Higher bonus for Norwegian shows

            return popularityScore + dateScore + norwegianBonus;
        };

        const scoreA = getScore(a, isANorwegian);
        const scoreB = getScore(b, isBNorwegian);

        return scoreB - scoreA;
    });

    return {
        results: combinedResults.slice(0, 20), // Keep top 20 shows
        total_pages: Math.max(
            recentNorwegianData.total_pages,
            allTimeNorwegianData.total_pages,
            norwegianShows.total_pages
        ),
        total_results: combinedResults.length,
        page: page,
    };
}

export async function getDiscoverTVShows(genres: string, page = 1) {
    const url = new URL("https://api.themoviedb.org/3/discover/tv");
    url.searchParams.set("sort_by", "vote_count.desc");
    url.searchParams.set("vote_count.gte", "100");
    url.searchParams.set("vote_average.gte", "7");
    if (genres) {
        url.searchParams.set("with_genres", genres);
    }
    const data = await fetchFromTMDB(url, page);
    return {
        results: data.results,
        total_pages: data.total_pages,
        total_results: data.total_results,
        page: data.page,
    };
}

export async function getTVShowGenres() {
    const url = new URL("https://api.themoviedb.org/3/genre/tv/list");
    const options: RequestInit = {
        method: "GET",
        headers: {
            accept: "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_TMDB_API_KEY}`,
        },
        next: {
            revalidate: 60 * 60 * 24,
        },
    };

    const response = await fetch(url.toString(), options);
    const data = await response.json();
    return data.genres;
}

export async function getTVShowDetails(id: string): Promise<TMDBTVShow> {
    const url = new URL(`https://api.themoviedb.org/3/tv/${id}`);
    const creditsUrl = new URL(`https://api.themoviedb.org/3/tv/${id}/credits`);
    const providersUrl = new URL(`https://api.themoviedb.org/3/tv/${id}/watch/providers`);

    const [show, credits, providers] = await Promise.all([
        fetchTVShowFromTMDB(url),
        fetch(creditsUrl, {
            headers: {
                Authorization: `Bearer ${process.env.NEXT_PUBLIC_TMDB_API_KEY}`,
                accept: "application/json",
            },
        }).then((res) => res.json()),
        fetch(providersUrl, {
            headers: {
                Authorization: `Bearer ${process.env.NEXT_PUBLIC_TMDB_API_KEY}`,
                accept: "application/json",
            },
        }).then((res) => res.json()),
    ]);

    return {
        ...show,
        cast: credits.cast?.slice(0, 6) || [],
        watch_providers: providers.results?.NO || null,
    };
}

export async function getSearchedTVShows(term: string, page = 1) {
    const url = new URL("https://api.themoviedb.org/3/search/tv");
    url.searchParams.set("query", term);
    const data = await fetchFromTMDB(url, page);
    return {
        results: data.results,
        total_pages: data.total_pages,
        total_results: data.total_results,
        page: data.page,
    };
}

export async function getSimilarTVShows(id: string) {
    // First get the TV show details to get its genres
    const url = new URL(`https://api.themoviedb.org/3/tv/${id}`);
    const show = await fetchTVShowFromTMDB(url);

    // Now fetch similar shows using the show's genres - get 3 pages to ensure we have enough shows
    const similarShowsPromises = [1, 2, 3].map((page) =>
        fetch(
            `https://api.themoviedb.org/3/discover/tv?with_genres=${show.genres.map((g: { id: number }) => g.id).join(",")}&sort_by=popularity.desc&page=${page}&without_genres=99,10755`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.NEXT_PUBLIC_TMDB_API_KEY}`,
                    accept: "application/json",
                },
            }
        ).then((res) => res.json())
    );

    const similarPagesData = await Promise.all(similarShowsPromises);
    const allSimilarShows = similarPagesData.flatMap((page) => page.results);

    // Filter out the current show, shows without posters, and take first 50
    const filteredSimilarShows = allSimilarShows
        .filter((s: any) => s.id !== show.id && s.poster_path !== null)
        .slice(0, 50)
        .map((show: any) => ({
            id: show.id,
            name: show.name,
            poster_path: show.poster_path,
            first_air_date: show.first_air_date,
            overview: show.overview,
            number_of_seasons: show.number_of_seasons || 0,
            number_of_episodes: show.number_of_episodes || 0,
            genres: show.genres || [],
            seasons: show.seasons || [],
            backdrop_path: show.backdrop_path,
            vote_average: show.vote_average,
        }));

    return filteredSimilarShows;
}
