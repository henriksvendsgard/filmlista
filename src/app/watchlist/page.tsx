import MovieList from "@/components/MovieList/MovieList";
import WatchList from "@/components/WatchList/WatchList";
import { getTopRatedMovies } from "@/lib/getMovies";

export default async function WatchlistPage() {
	const topRatedMovies = await getTopRatedMovies();

	return (
		<div className="container mx-auto px-5 py-8 lg:px-10">
			<WatchList title="Watchlist" />
			<div className="lg:mt-[300px] mt-[300px]">
				<MovieList title="Utforsk tidenes beste filmer" movies={topRatedMovies} isVertical />
			</div>
		</div>
	);
}
