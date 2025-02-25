export interface TVShow {
	id: string;
	tvshow_id: string;
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

export interface TMDBTVShow {
	id: number;
	name: string;
	poster_path: string | null;
	backdrop_path: string | null;
	first_air_date: string;
	vote_average: number;
	number_of_seasons: number;
	number_of_episodes: number;
	genres: { id: number; name: string }[];
	overview: string;
	added_by_displayname?: string;
	seasons: {
		id: number;
		name: string;
		episode_count: number;
		season_number: number;
		air_date: string;
	}[];
}
