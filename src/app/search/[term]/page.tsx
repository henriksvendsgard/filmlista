import { notFound } from "next/navigation";
import MovieList from "@/components/MovieList/MovieList";
import { getPopularMovies, getSearchedMovies } from "@/lib/getMovies";
import SearchBox from "@/components/Search/SearchBox";

type SearchPageProps = {
	params: Promise<{
		term: string;
	}>;
};

async function SearchPage(props: SearchPageProps) {
	const params = await props.params;

	const { term } = params;

	if (!term) notFound();

	// Removes spaces from the search term
	const termToUse = decodeURI(term);

	const searchedMovies = await getSearchedMovies(termToUse);
	const popularMovies = await getPopularMovies();

	return (
		<>
			<div className="px-6 lg:px-10 transition-all duration-300">
				<section className="movie-list w-full h-full">
					{searchedMovies.results.length > 0 ? (
						<MovieList title={`Resultater for "${termToUse}"`} movies={searchedMovies} />
					) : (
						<>
							<h3 className="my-32 sm:my-64 mx-auto w-full text-3xl">Fant ingen resultater for "{termToUse}"</h3>
							<MovieList title="Sjekk ut populære filmer i steden!" movies={popularMovies} />
						</>
					)}
				</section>
			</div>
		</>
	);
}

export default SearchPage;
