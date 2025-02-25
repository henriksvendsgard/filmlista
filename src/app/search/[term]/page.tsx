"use client";

import { notFound } from "next/navigation";
import MovieList from "@/components/MovieList/MovieList";
import TVShowList from "@/components/TVShowList/TVShowList";
import { getSearchedMovies } from "@/lib/getMovies";
import { getSearchedTVShows } from "@/lib/getTVShows";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface SearchPageProps {
	params: {
		term: string;
	};
}

export default function SearchPage({ params }: SearchPageProps) {
	const [movies, setMovies] = useState<any>(null);
	const [tvshows, setTVShows] = useState<any>(null);
	const [isLoading, setIsLoading] = useState(true);
	const searchParams = useSearchParams();
	const router = useRouter();
	const mediaType = searchParams.get("type") || "movie";
	const decodedTerm = decodeURIComponent(params.term);

	const fetchResults = useCallback(async () => {
		if (!decodedTerm) return notFound();

		setIsLoading(true);
		try {
			const [movieResults, tvResults] = await Promise.all([getSearchedMovies(decodedTerm), getSearchedTVShows(decodedTerm)]);

			setMovies(movieResults);
			setTVShows(tvResults);
		} catch (error) {
			console.error("Error fetching search results:", error);
		}
		setIsLoading(false);
	}, [decodedTerm]);

	useEffect(() => {
		fetchResults();
	}, [fetchResults]);

	const handleTabChange = (value: string) => {
		const newParams = new URLSearchParams();
		searchParams.forEach((value, key) => {
			newParams.set(key, value);
		});
		newParams.set("type", value);
		router.push(`/search/${params.term}?${newParams.toString()}`);
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<h1 className="text-4xl font-bold mb-8">Søkeresultater for "{decodedTerm}"</h1>

			<Tabs value={mediaType} onValueChange={handleTabChange} className="w-full">
				<TabsList className="mb-8">
					<TabsTrigger value="movie">Filmer ({movies?.total_results || 0})</TabsTrigger>
					<TabsTrigger value="tv">TV-serier ({tvshows?.total_results || 0})</TabsTrigger>
				</TabsList>

				<TabsContent value="movie">
					<MovieList movies={movies || { results: [], total_pages: 0, page: 1, total_results: 0 }} title="Filmer" isLoading={isLoading} isOnFrontPage />
				</TabsContent>

				<TabsContent value="tv">
					<TVShowList tvshows={tvshows || { results: [], total_pages: 0, page: 1, total_results: 0 }} title="TV-serier" isLoading={isLoading} isOnFrontPage />
				</TabsContent>
			</Tabs>
		</div>
	);
}
