
import MovieDetails from "@/components/MovieDetails/MovieDetails";
import { getMovieDetails } from "@/lib/getMovies";

type MoviePageProps = {
	params: Promise<{
		id: string;
	}>;
};

export default async function MovieDetailsPage(props: MoviePageProps) {
    const params = await props.params;

    const {
        id
    } = params;

    const movie = await getMovieDetails(id);

    return <MovieDetails movie={movie} />;
}
