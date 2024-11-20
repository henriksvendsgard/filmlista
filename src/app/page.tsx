import MovieList from "@/components/MovieList/MovieList";
import { getPopularMovies } from "@/lib/getMovies";

export default async function Home({ searchParams }: { searchParams: { page: string } }) {
	const page = Number(searchParams.page) || 1;
	const movies = await getPopularMovies(page);

	return (
		<div className="px-5 lg:px-10 mb-20">
			<div className="flex flex-col items-center"></div>
			<MovieList title="Populære filmer" movies={movies} isOnFrontPage />
		</div>
	);
}
