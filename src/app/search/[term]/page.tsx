"use client";

import MovieList from "@/components/MovieList/MovieList";
import TVShowList from "@/components/TVShowList/TVShowList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSearchedMovies } from "@/lib/getMovies";
import { getSearchedTVShows } from "@/lib/getTVShows";
import { Loader2 } from "lucide-react";
import { notFound, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

interface SearchPageProps {
	params: {
		term: string;
	};
}

interface SearchResults {
	results: any[];
	total_pages: number;
	page: number;
	total_results: number;
}

export default function SearchPage({ params }: SearchPageProps) {
	const [movies, setMovies] = useState<SearchResults | null>(null);
	const [tvshows, setTVShows] = useState<SearchResults | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isFetchingMore, setIsFetchingMore] = useState(false);
	const searchParams = useSearchParams();
	const router = useRouter();
	const mediaType = searchParams.get("type") || "movie";
	const decodedTerm = decodeURIComponent(params.term);
	const loadMoreRef = useRef<HTMLDivElement>(null);

	const fetchResults = useCallback(
		async (currentPage: number, isLoadingMore = false) => {
			if (!decodedTerm) return notFound();

			if (!isLoadingMore) {
				setIsLoading(true);
			}
			try {
				const [movieResults, tvResults] = await Promise.all([getSearchedMovies(decodedTerm, currentPage), getSearchedTVShows(decodedTerm, currentPage)]);

				if (isLoadingMore) {
					setMovies((prev: SearchResults | null) =>
						prev
							? {
									...prev,
									results: [...prev.results, ...movieResults.results],
									page: movieResults.page,
							  }
							: movieResults
					);

					setTVShows((prev: SearchResults | null) =>
						prev
							? {
									...prev,
									results: [...prev.results, ...tvResults.results],
									page: tvResults.page,
							  }
							: tvResults
					);
				} else {
					setMovies(movieResults);
					setTVShows(tvResults);
				}
			} catch (error) {
				console.error("Error fetching search results:", error);
			}
			setIsLoading(false);
			setIsFetchingMore(false);
		},
		[decodedTerm]
	);

	useEffect(() => {
		fetchResults(1);
	}, [fetchResults]);

	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				const first = entries[0];
				if (first.isIntersecting && !isFetchingMore) {
					const currentResults = mediaType === "movie" ? movies : tvshows;
					if (currentResults && currentResults.page < currentResults.total_pages) {
						setIsFetchingMore(true);
						fetchResults(currentResults.page + 1, true);
					}
				}
			},
			{ threshold: 0.1 }
		);

		if (loadMoreRef.current) {
			observer.observe(loadMoreRef.current);
		}

		return () => observer.disconnect();
	}, [fetchResults, isFetchingMore, mediaType, movies, tvshows]);

	const handleTabChange = (value: string) => {
		const newParams = new URLSearchParams();
		newParams.set("type", value);
		router.push(`/search/${params.term}?${newParams.toString()}`);

		// Reset results when changing tabs
		if (value === "movie") {
			setMovies((prev: SearchResults | null) => (prev ? { ...prev, results: prev.results.slice(0, 20) } : null));
		} else {
			setTVShows((prev: SearchResults | null) => (prev ? { ...prev, results: prev.results.slice(0, 20) } : null));
		}
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<h1 className="text-4xl font-bold mb-8">Søkeresultater for &quot;{decodedTerm}&quot;</h1>

			<Tabs value={mediaType} onValueChange={handleTabChange} className="w-full">
				<TabsList className="mb-8">
					<TabsTrigger value="movie">Filmer ({movies?.total_results || 0})</TabsTrigger>
					<TabsTrigger value="tv">TV-serier ({tvshows?.total_results || 0})</TabsTrigger>
				</TabsList>

				<TabsContent value="movie">
					<MovieList movies={movies || { results: [], total_pages: 0, page: 1, total_results: 0 }} title="Filmer" isLoading={isLoading} isOnFrontPage={false} />
				</TabsContent>

				<TabsContent value="tv">
					<TVShowList tvshows={tvshows || { results: [], total_pages: 0, page: 1, total_results: 0 }} title="TV-serier" isLoading={isLoading} isOnFrontPage={false} />
				</TabsContent>
			</Tabs>

			{/* Infinite scroll trigger */}
			<div ref={loadMoreRef} className="h-10 w-full">
				{isFetchingMore && (
					<div className="flex justify-center items-center py-4">
						<Loader2 className="w-10 h-10 animate-spin text-filmlista-primary" />
					</div>
				)}
			</div>
		</div>
	);
}
