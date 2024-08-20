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
			<div className="px-10">
				<section className="movie-list w-full h-full">
					<MovieList title={`Resultater for "${termToUse}"`} movies={searchedMovies} isVertical />
					{searchedMovies.length === 0 && (
						<>
							<h3>Finner ikke filmen i databasen...</h3>
							<MovieList isVertical={true} title="Sjekk ut populære filmer i steden!" movies={popularMovies} />
						</>
					)}
				</section>
			</div>
		</>
	);
}

export default SearchPage;
