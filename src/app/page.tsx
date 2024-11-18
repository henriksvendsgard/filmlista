import MovieList from "@/components/MovieList/MovieList";
import { getPopularMovies } from "@/lib/getMovies";

export default async function Home() {
	const popularMovies = await getPopularMovies();

	return (
		<div className="px-5 lg:px-10 mb-20">
			<div className="flex flex-col items-center"></div>
			<MovieList title="Populære filmer" movies={popularMovies} />
		</div>
	);
}
