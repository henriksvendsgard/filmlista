export interface Movie {
  id: string;
  movie_id: string;
  title: string;
  poster_path: string;
  watched: boolean;
  added_at?: string;
  added_by?: string;
  added_by_email?: string;
}

export interface TMDBMovie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  runtime: number | null;
  genres: { id: number; name: string; }[];
  overview: string;
} 