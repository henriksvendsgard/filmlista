
import MovieDetails from "@/components/MovieDetails/MovieDetails";
import { getMovieDetails } from "@/lib/getMovies";

type MoviePageProps = {
	params: {
		id: string;
	};
};

export default async function MovieDetailsPage({ params: { id } }: MoviePageProps) {
	
	const movie = await getMovieDetails(id);

	return <MovieDetails movie={movie} />;
}
