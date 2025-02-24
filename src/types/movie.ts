export interface Movie {
	id: string;
	movie_id: string;
	title: string;
	poster_path: string;
	added_at: string;
	added_by: string;
	added_by_displayname?: string;
	watched_by: {
		user_id: string;
		displayname: string;
		watched_at: string;
	}[];
	is_watched_by_me: boolean;
}

export interface TMDBMovie {
	id: number;
	title: string;
	poster_path: string | null;
	backdrop_path: string | null;
	release_date: string;
	vote_average: number;
	runtime: number | null;
	genres: { id: number; name: string }[];
	overview: string;
}
