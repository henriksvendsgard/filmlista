import { TMDBTVShow } from "@/types/tvshow";
import { SearchResults } from "./typings";

async function fetchFromTMDB(url: URL, page = 1, region?: string) {
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
	const data = (await response.json()) as SearchResults;

	data.results = data.results.filter((show) => show.poster_path !== null);

	return data;
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

	// Fetch both Norwegian and US popular shows
	const [norwegianData, usData] = await Promise.all([fetchFromTMDB(url, page, "NO"), fetchFromTMDB(url, page, "US")]);

	// Combine and deduplicate results based on show ID
	const combinedResults = [...norwegianData.results];
	const norwegianIds = new Set(norwegianData.results.map((show) => show.id));

	for (const usShow of usData.results) {
		if (!norwegianIds.has(usShow.id)) {
			combinedResults.push(usShow);
		}
	}

	// Sort by popularity and take top results
	combinedResults.sort((a, b) => b.popularity - a.popularity);

	return {
		results: combinedResults.slice(0, 20), // Keep top 20 shows
		total_pages: Math.max(norwegianData.total_pages, usData.total_pages),
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
		fetch(`https://api.themoviedb.org/3/discover/tv?with_genres=${show.genres.map((g: { id: number }) => g.id).join(",")}&sort_by=popularity.desc&page=${page}&without_genres=99,10755`, {
			headers: {
				Authorization: `Bearer ${process.env.NEXT_PUBLIC_TMDB_API_KEY}`,
				accept: "application/json",
			},
		}).then((res) => res.json())
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
