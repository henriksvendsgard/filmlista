import { notFound } from "next/navigation";
import MovieList from "@/components/MovieList/MovieList";
import { getPopularMovies, getSearchedMovies } from "@/lib/getMovies";
import SearchBox from "@/components/Search/SearchBox";

type SearchPageProps = {
	params: {
		term: string;
	};
};

async function SearchPage({ params: { term } }: SearchPageProps) {
	if (!term) notFound();

	// Removes spaces from the search term
	const termToUse = decodeURI(term);

	const searchedMovies = await getSearchedMovies(termToUse);
	const popularMovies = await getPopularMovies();

	return (
		<>
			<div className="flex w-full lg:max-w-[1000px] px-10 min-h-screen flex-col items-center">
				<section className="movie-list w-full h-full">
					<SearchBox />
					<MovieList
						title={`Resultater for "${termToUse}"`}
						movies={searchedMovies}
						isVertical
					/>
					{searchedMovies.length === 0 && (
						<>
							<h3>Finner ikke filmen i databasen...</h3>
							<MovieList
								isVertical={true}
								title="Sjekk ut populære filmer i steden!"
								movies={popularMovies}
							/>
						</>
					)}
				</section>
			</div>
		</>
	);
}

export default SearchPage;
