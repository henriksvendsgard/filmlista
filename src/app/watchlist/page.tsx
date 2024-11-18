import MovieList from "@/components/MovieList/MovieList";
import WatchList from "@/components/WatchList/WatchList";
import { getUpcomingMovies } from "@/lib/getMovies";

export default async function WatchlistPage() {
	const upcomingMovies = await getUpcomingMovies();

	return (
		<div className="container mx-auto px-5 pb-8 lg:px-10 transition-all duration-300">
			<WatchList/>
			<div className="lg:mt-[300px] mt-[300px]">
				<MovieList title="Kommende filmer" movies={upcomingMovies} />
			</div>
		</div>
	);
}
