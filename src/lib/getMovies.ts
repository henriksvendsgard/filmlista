import { SearchResults } from "./typings";

async function fetchFromTMDB(url: URL) {
	url.searchParams.set("include_adult", "false");
	url.searchParams.set("include_video", "false");
	url.searchParams.set("language", "en-US");
	url.searchParams.set("page", "1");

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

	return data;
}

async function fetchMovieFromTMDB(url: URL) {
	url.searchParams.set("include_adult", "false");
	url.searchParams.set("include_video", "false");
	url.searchParams.set("sort_by", "popularity.desc");
	url.searchParams.set("language", "en-US");
	url.searchParams.set("page", "1");

	const options: RequestInit = {
		method: "GET",
		headers: {
			accept: "application/json",
			Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
		},
		next: {
			revalidate: 60 * 60 * 24,
		},
	};

	const response = await fetch(url.toString(), options);
	const movie = await response.json();

	return movie;
}

export async function getUpcomingMovies() {
	const url = new URL("https://api.themoviedb.org/3/movie/upcoming");
	const data = await fetchFromTMDB(url);
	return data.results;
}

export async function getTopRatedMovies() {
	const url = new URL("https://api.themoviedb.org/3/movie/top_rated");
	const data = await fetchFromTMDB(url);

	return data.results;
}

export async function getPopularMovies() {
	const url = new URL("https://api.themoviedb.org/3/movie/popular");
	const data = await fetchFromTMDB(url);

	return data.results;
}

export async function getDiscoverMovies(id?: string, keywords?: string) {
	const url = new URL("https://api.themoviedb.org/3/discover/movie");
	if (id) {
		url.searchParams.set("with_genres", id);
	}
	if (keywords) {
		url.searchParams.set("with_keywords", keywords);
	}
	const data = await fetchFromTMDB(url);

	return data.results;
}

export async function getSearchedMovies(term: string) {
	const url = new URL("https://api.themoviedb.org/3/search/movie");
	url.searchParams.set("query", term);
	const data = await fetchFromTMDB(url);

	return data.results;
}

export async function getMovieDetails(id: string) {
	const url = new URL(`https://api.themoviedb.org/3/movie/${id}`);
	const movie = await fetchMovieFromTMDB(url);

	return movie;
}
