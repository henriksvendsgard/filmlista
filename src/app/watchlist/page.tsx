import MovieList from "@/components/MovieList/MovieList";
import WatchList from "@/components/WatchList/WatchList";
import { getUpcomingMovies } from "@/lib/getMovies";

export default async function WatchlistPage() {
	const upcomingMovies = await getUpcomingMovies();

	return (
		<div className="container mx-auto px-5 py-8 lg:px-10">
			<WatchList title="Watchlist" />
			<div className="lg:mt-[300px] mt-[300px]">
				<MovieList title="Kommende filmer" movies={upcomingMovies} isVertical />
			</div>
		</div>
	);
}
