"use client";

import { TMDBMovie } from "@/types/movie";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { MovieCard } from "../MovieCard/MovieCard";

interface List {
	id: string;
	name: string;
	owner_id: string;
}

interface MovieListProps {
	movies: TMDBMovie[];
	title?: string;
}

interface MovieDetails {
	added_at: string;
	added_by: string;
	added_by_email: string;
}

// First, let's create a proper type for the raw data
type RawListMovie = {
	movie_id: string;
	list_id: string;
	added_at: string;
	added_by: string;
	profile: {
		email: string;
	};
};

// Add this type at the top of your file
type MovieListAction = {
	type: "added" | "removed";
	listId: string;
	movieId: string;
};

export default function MovieList({ movies, title }: MovieListProps) {
	const router = useRouter();
	const [lists, setLists] = useState<{ owned: List[]; shared: List[] }>({ owned: [], shared: [] });
	const [moviesInLists, setMoviesInLists] = useState<{ [key: number]: boolean }>({});
	const [movieListMap, setMovieListMap] = useState<{ [key: string]: string[] }>({});
	const [movieDetails, setMovieDetails] = useState<{ [key: string]: MovieDetails }>({});

	const supabase = createClientComponentClient();

	const fetchLists = async () => {
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) return;

		try {
			const { data: sharedListIds, error: sharedError } = await supabase.from("shared_lists").select("list_id").eq("user_id", user.id);

			if (sharedError) throw sharedError;

			const { data: allLists, error: listsError } = await supabase.from("lists").select("*");

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
	};

	const checkMovieInLists = async (movieId: number) => {
		try {
			const { data, error } = await supabase.from("list_movies").select("list_id").eq("movie_id", movieId.toString());

			if (error) throw error;

			return data.length > 0;
		} catch (error) {
			console.error("Error checking movie in lists:", error);
			return false;
		}
	};

	const handleAddToList = async (movie: TMDBMovie, listId: string) => {
		try {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) return;

			const { error } = await supabase.from("list_movies").insert({
				list_id: listId,
				movie_id: movie.id.toString(),
				title: movie.title,
				poster_path: movie.poster_path,
				added_by: user.id,
			});

			if (error) throw error;

			// Update local state immediately
			setMovieListMap((prev) => ({
				...prev,
				[movie.id.toString()]: [...(prev[movie.id.toString()] || []), listId],
			}));

			// Emit event for other components
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
			const { error } = await supabase.from("list_movies").delete().eq("movie_id", movie.id.toString()).eq("list_id", listId);

			if (error) throw error;

			// Update local state immediately
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

			// Emit event for other components
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

	const fetchMovieListMap = async () => {
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) return;

		try {
			const { data, error } = await supabase
				.from("list_movies")
				.select(
					`
					movie_id, 
					list_id, 
					added_at,
					added_by,
					profile:profiles!list_movies_added_by_fkey (
						email
					)
				`
				)
				.in(
					"movie_id",
					movies.map((m) => m.id.toString())
				);

			if (error) throw error;

			// Cast data to unknown first, then to our type
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
	};

	useEffect(() => {
		fetchLists();
		fetchMovieListMap();
	}, [movies, fetchLists, fetchMovieListMap]);

	useEffect(() => {
		console.log("movieListMap:", movieListMap);
		console.log("movieDetails:", movieDetails);
	}, [movieListMap, movieDetails]);

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

	return (
		<div className="space-y-6">
			{title && <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>}
			<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
				{movies?.map((movie) => (
					<MovieCard
						key={movie.id}
						movie={{
							id: movie.id.toString(),
							movie_id: movie.id.toString(),
							title: movie.title,
							poster_path: movie.poster_path ?? "",
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
						onClick={() => router.push(`/movie/${movie.id}`)}
					/>
				))}
			</div>
		</div>
	);
}
