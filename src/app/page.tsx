import MovieList from "@/components/MovieList/MovieList";
import SearchBox from "@/components/Search/SearchBox";
import { getPopularMovies } from "@/lib/getMovies";

export default async function Home() {
	const popularMovies = await getPopularMovies();

	return (
		<div className="px-10">
			<div className="flex flex-col items-center"></div>
			{/* <SearchBox /> */}
			<MovieList isVertical={true} title="Populære filmer:" movies={popularMovies} />
		</div>
	);
}
