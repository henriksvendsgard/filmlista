"use client";

import { Button } from "@/components/ui/button";
import { TMDBMovie } from "@/types/movie";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { MovieCard } from "../MovieCard/MovieCard";
import { MovieGridSkeleton } from "./MovieCardSkeleton";

interface List {
	id: string;
	name: string;
	owner_id: string;
}

interface MovieListProps {
	movies: {
		results: TMDBMovie[];
		total_pages: number;
		page: number;
		total_results: number;
	};
	title: string;
	isOnFrontPage?: boolean;
}

interface MovieDetails {
	added_at: string;
	added_by: string;
	added_by_email: string;
}

type RawListMovie = {
	movie_id: string;
	list_id: string;
	added_at: string;
	added_by: string;
	profile: {
		email: string;
	};
};

type MovieListAction = {
	type: "added" | "removed";
	listId: string;
	movieId: string;
};

export default function MovieList({ movies, title, isOnFrontPage }: MovieListProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [isLoading, setIsLoading] = useState(false);
	const [lists, setLists] = useState<{ owned: List[]; shared: List[] }>({ owned: [], shared: [] });
	const [movieListMap, setMovieListMap] = useState<{ [key: string]: string[] }>({});
	const [movieDetails, setMovieDetails] = useState<{ [key: string]: MovieDetails }>({});

	const supabase = createClientComponentClient();

	// Loading state
	useEffect(() => {
		setIsLoading(false);
	}, [movies]);

	const fetchLists = useCallback(async () => {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) return;

		try {
			const { data: sharedListIds, error: sharedError } = await supabase
				.from("shared_lists")
				.select("list_id")
				.eq("user_id", user.id);

			if (sharedError) throw sharedError;

			const { data: allLists, error: listsError } = await supabase
				.from("lists")
				.select("*");

			if (listsError) throw listsError;

			const sharedListIdsArray = (sharedListIds || []).map((item) => item.list_id);
			const ownedLists = allLists.filter((list) => list.owner_id === user.id);
			const sharedLists = allLists.filter((list) => sharedListIdsArray.includes(list.id));

			setLists({
				owned: ownedLists || [],
				shared: sharedLists || [],
			});
		} catch (error) {
			console.error("Error fetching lists:", error);
			toast({
				title: "Error",
				description: "Failed to fetch lists",
				variant: "destructive",
			});
		}
	}, [supabase]);

	const handleAddToList = async (movie: TMDBMovie, listId: string) => {
		try {
			const { data: { user } } = await supabase.auth.getUser();
			if (!user) return;

			const { error } = await supabase.from("list_movies").insert({
				list_id: listId,
				movie_id: movie.id.toString(),
				title: movie.title,
				poster_path: movie.poster_path,
				added_by: user.id,
			});

			if (error) throw error;

			setMovieListMap((prev) => ({
				...prev,
				[movie.id.toString()]: [...(prev[movie.id.toString()] || []), listId],
			}));

			const event = new CustomEvent("movieListUpdate", {
				detail: {
					type: "added",
					listId,
					movieId: movie.id.toString(),
				} as MovieListAction,
			});
			window.dispatchEvent(event);

			toast({
				title: "Film lagt til i listen",
				description: `${movie.title} er lagt til i listen`,
				className: "bg-blue-800",
			});
		} catch (error) {
			console.error("Error adding movie to list:", error);
			toast({
				title: "Feil",
				description: "Kunne ikke legge til filmen i listen",
				variant: "destructive",
			});
		}
	};

	const handleRemoveFromList = async (movie: TMDBMovie, listId: string) => {
		try {
			const { error } = await supabase
				.from("list_movies")
				.delete()
				.eq("movie_id", movie.id.toString())
				.eq("list_id", listId);

			if (error) throw error;

			setMovieListMap((prev) => {
				const newMap = { ...prev };
				const movieId = movie.id.toString();
				if (newMap[movieId]) {
					newMap[movieId] = newMap[movieId].filter((id) => id !== listId);
					if (newMap[movieId].length === 0) {
						delete newMap[movieId];
					}
				}
				return newMap;
			});

			const event = new CustomEvent("movieListUpdate", {
				detail: {
					type: "removed",
					listId,
					movieId: movie.id.toString(),
				} as MovieListAction,
			});
			window.dispatchEvent(event);

			toast({
				title: "Film fjernet fra listen",
				description: `${movie.title} er fjernet fra listen`,
				className: "bg-orange-800",
			});
		} catch (error) {
			console.error("Error removing movie from list:", error);
			toast({
				title: "Feil",
				description: "Kunne ikke fjerne filmen fra listen",
				variant: "destructive",
			});
		}
	};

	const createPageURL = (pageNumber: number) => {
		const params = new URLSearchParams(Array.from(searchParams.entries()));
		params.set("page", pageNumber.toString());
		return `${pathname}?${params.toString()}`;
	};

	const paginate = (pageNumber: number) => {
		setIsLoading(true);
		router.push(createPageURL(pageNumber));
		window.scrollTo({
			top: 0,
			behavior: "smooth",
		});
	};

	const fetchMovieListMap = useCallback(async () => {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) return;

		try {
			const { data, error } = await supabase
				.from("list_movies")
				.select(`
					movie_id, 
					list_id, 
					added_at,
					added_by,
					profile:profiles!list_movies_added_by_fkey (
						email
					)
				`)
				.in(
					"movie_id",
					movies.results.map((m) => m.id.toString())
				);

			if (error) throw error;

			const typedData = data as unknown as RawListMovie[];
			const movieMap: { [key: string]: string[] } = {};
			const movieDetails: { [key: string]: MovieDetails } = {};

			typedData.forEach((item) => {
				if (!movieMap[item.movie_id]) {
					movieMap[item.movie_id] = [];
				}
				movieMap[item.movie_id].push(item.list_id);

				movieDetails[item.movie_id] = {
					added_at: item.added_at,
					added_by: item.added_by,
					added_by_email: item.profile.email,
				};
			});

			setMovieListMap(movieMap);
			setMovieDetails(movieDetails);
		} catch (error) {
			console.error("Error fetching movie list map:", error);
		}
	}, [movies.results, supabase]);

	useEffect(() => {
		fetchLists();
		fetchMovieListMap();
	}, [fetchLists, fetchMovieListMap]);

	useEffect(() => {
		const handleMovieListUpdate = (event: CustomEvent<MovieListAction>) => {
			const { type, movieId, listId } = event.detail;
			setMovieListMap((prev) => {
				const newMap = { ...prev };
				if (type === "removed") {
					if (newMap[movieId]) {
						newMap[movieId] = newMap[movieId].filter((id) => id !== listId);
						if (newMap[movieId].length === 0) {
							delete newMap[movieId];
						}
					}
				} else if (type === "added") {
					if (!newMap[movieId]) {
						newMap[movieId] = [];
					}
					newMap[movieId] = [...newMap[movieId], listId];
				}
				return newMap;
			});
		};

		window.addEventListener("movieListUpdate", handleMovieListUpdate as EventListener);
		return () => {
			window.removeEventListener("movieListUpdate", handleMovieListUpdate as EventListener);
		};
	}, []);

	const maxPages = Math.min(movies.total_pages, 500);
	const currentPage = movies.page;

	return (
		<section className="movie-list w-full h-full max-w-full">
			<h2 className="text-3xl font-bold tracking-tight mb-6">{title}</h2>

			<div className="w-full max-w-full">
				{isLoading ? (
					<MovieGridSkeleton />
				) : (
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
						{movies.results.map((movie) => (
							<MovieCard
								key={movie.id}
								movie={{
									id: movie.id.toString(),
									movie_id: movie.id.toString(),
									title: movie.title,
									poster_path: movie.poster_path || "",
									watched: false,
									added_at: movieDetails[movie.id.toString()]?.added_at,
									added_by: movieDetails[movie.id.toString()]?.added_by,
									added_by_email: movieDetails[movie.id.toString()]?.added_by_email,
								}}
								isInList={!!movieListMap[movie.id.toString()]?.length}
								lists={lists}
								movieLists={movieListMap[movie.id.toString()] || []}
								onAddToList={(listId) => handleAddToList(movie, listId)}
								onRemoveFromList={(listId) => handleRemoveFromList(movie, listId)}
								onToggleWatched={() => {}}
								onClick={() => router.push(`/movie/${movie.id}`)}
								currentListId={undefined}
								isWatchList={false}
								showAddedBy={false}
							/>
						))}
					</div>
				)}
			</div>

			{isOnFrontPage && maxPages > 1 && (
				<div className="flex justify-center items-center gap-2 mt-8 mb-12">
					<Button variant="outline" onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1 || isLoading} className="h-10">
						<ChevronLeft className="h-4 w-4 sm:mr-2" />
						<span className="hidden sm:inline">Forrige</span>
					</Button>

					<div className="flex items-center gap-2">
						<span className="text-sm">
							Side {currentPage} av {maxPages}
						</span>
					</div>

					<Button variant="outline" onClick={() => paginate(currentPage + 1)} disabled={currentPage === maxPages || isLoading} className="h-10">
						<span className="hidden sm:inline">Neste</span>
						<ChevronRight className="h-4 w-4 sm:ml-2" />
					</Button>
				</div>
			)}
		</section>
	);
}
