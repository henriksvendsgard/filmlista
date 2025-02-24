"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Movie } from "@/types/movie";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Film } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { MovieCard } from "../MovieCard/MovieCard";
import { Skeleton } from "../ui/skeleton";
import { useSupabase } from "@/components/SupabaseProvider";

interface List {
	id: string;
	name: string;
	owner_id: string;
}

interface DatabaseMovie {
	movie_id: string;
	title: string;
	poster_path: string;
	added_at: string;
	added_by: string;
	profiles: {
		displayname: string;
		email: string;
	};
}

interface DatabaseWatchedMovie {
	user_id: string;
	movie_id: string;
	watched_at: string;
	profiles: {
		displayname: string;
	};
}

type ProcessedMovie = Movie & {
	watched_by: {
		user_id: string;
		displayname: string;
		watched_at: string;
	}[];
	is_watched_by_me: boolean;
};

type MovieListAction = {
	type: "added" | "removed";
	listId: string;
	movieId: string;
};

export default function Watchlist() {
	const [isLoading, setIsLoading] = useState(true);
	const [movies, setMovies] = useState<ProcessedMovie[]>([]);
	const [lists, setLists] = useState<{ owned: List[]; shared: List[] }>({ owned: [], shared: [] });
	const [selectedList, setSelectedList] = useState<string | null>(null);

	const supabase = createClientComponentClient();
	const { user } = useSupabase();
	const router = useRouter();
	const searchParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
	const listIdFromUrl = searchParams.get("list");

	// Reset loading state when user changes
	useEffect(() => {
		if (!user) {
			setIsLoading(true);
		}
	}, [user]);

	const updateUrlWithList = useCallback(
		(listId: string | null) => {
			const newUrl = listId ? `${window.location.pathname}?list=${listId}` : window.location.pathname;
			router.replace(newUrl);
		},
		[router]
	);

	// Update the list selection handler
	const handleListSelection = useCallback(
		(listId: string) => {
			if (listId === "_header_owned" || listId === "_header_shared" || listId === "_no_lists") return;
			setSelectedList(listId);
			updateUrlWithList(listId);
		},
		[updateUrlWithList]
	);

	const fetchLists = useCallback(async () => {
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

			// Set initial list selection from URL or default to first list
			if (!selectedList) {
				const initialList = listIdFromUrl || ownedLists[0]?.id || sharedLists[0]?.id;
				if (initialList) {
					setSelectedList(initialList);
					if (!listIdFromUrl) {
						updateUrlWithList(initialList);
					}
				}
			}
		} catch (error) {
			console.error("Error fetching lists:", error);
			toast({
				title: "Error",
				description: "Failed to fetch lists",
				variant: "destructive",
			});
		}
	}, [supabase, user, listIdFromUrl, updateUrlWithList, selectedList]);

	const fetchMovies = useCallback(async () => {
		if (!selectedList || !user) return;
		setIsLoading(true); // Set loading when starting to fetch movies

		try {
			// Get all movies in the list
			const { data: rawMoviesData, error: moviesError } = await supabase
				.from("list_movies")
				.select(
					`
					movie_id,
					title,
					poster_path,
					added_at,
					added_by,
					profiles (displayname, email)
				`
				)
				.eq("list_id", selectedList)
				.order("added_at", { ascending: false });

			if (moviesError) throw moviesError;

			// Get watched status for all users
			const { data: watchedData, error: watchedError } = await supabase.from("watched_movies").select("user_id, movie_id, watched_at").eq("list_id", selectedList);

			if (watchedError) throw watchedError;

			// Get profiles for all users who have watched movies
			const userIds = Array.from(new Set(watchedData?.map((w) => w.user_id) || []));
			const { data: profilesData, error: profilesError } = await supabase.from("profiles").select("id, displayname").in("id", userIds);

			if (profilesError) throw profilesError;

			// Create a map of user_id to displayname
			const profileMap = new Map(profilesData?.map((p) => [p.id, p.displayname]) || []);

			const moviesData = rawMoviesData as unknown as DatabaseMovie[];

			// Process movies with watched information
			const processedMovies = moviesData.map((movie) => {
				const watchedByUsers =
					watchedData
						?.filter((w) => w.movie_id === movie.movie_id)
						.map((w) => ({
							user_id: w.user_id,
							displayname: profileMap.get(w.user_id) || "Unknown",
							watched_at: w.watched_at,
						})) || [];

				return {
					id: movie.movie_id,
					movie_id: movie.movie_id,
					title: movie.title,
					poster_path: movie.poster_path,
					added_at: movie.added_at,
					added_by: movie.added_by,
					added_by_displayname: movie.profiles?.displayname || movie.profiles?.email || "Unknown",
					watched_by: watchedByUsers,
					is_watched_by_me: watchedByUsers.some((w) => w.user_id === user.id),
				};
			});

			setMovies(processedMovies);
		} catch (error) {
			console.error("Error fetching movies:", error);
			setMovies([]);
		} finally {
			setIsLoading(false); // Only set loading to false after movies are processed
		}
	}, [selectedList, supabase, user]);

	const handleRemoveFromList = async (listId: string, movieId: string, movieTitle: string) => {
		try {
			const { error } = await supabase.from("list_movies").delete().eq("list_id", listId).eq("movie_id", movieId);

			if (error) throw error;

			// Emit så andre komponenter kan oppdatere seg
			const event = new CustomEvent("movieListUpdate", {
				detail: {
					type: "removed",
					listId,
					movieId,
				},
			});
			window.dispatchEvent(event);

			// Refresh listen
			fetchMovies();

			toast({
				title: "Film fjernet",
				description: `"${movieTitle}" er fjernet fra listen`,
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

	const handleToggleWatched = async (movieId: string, currentWatchedStatus: boolean) => {
		try {
			if (currentWatchedStatus) {
				// Remove watched status
				const { error } = await supabase.from("watched_movies").delete().eq("movie_id", movieId).eq("list_id", selectedList).eq("user_id", user?.id);

				if (error) throw error;
			} else {
				// Add watched status
				const { error } = await supabase.from("watched_movies").insert({
					movie_id: movieId,
					list_id: selectedList,
					user_id: user?.id,
				});

				if (error) throw error;
			}

			// Update local state
			if (movies) {
				setMovies(
					movies.map((movie) => {
						if (movie.movie_id === movieId) {
							const updatedWatchedBy = currentWatchedStatus
								? movie.watched_by.filter((w) => w.user_id !== user?.id)
								: [
										...movie.watched_by,
										{
											user_id: user?.id || "",
											displayname: user?.user_metadata?.displayname || "Unknown",
											watched_at: new Date().toISOString(),
										},
								  ];

							return {
								...movie,
								watched_by: updatedWatchedBy,
								is_watched_by_me: !currentWatchedStatus,
							};
						}
						return movie;
					})
				);
			}

			toast({
				title: currentWatchedStatus ? "Markert som usett" : "Markert som sett",
				description: `Filmen er nå markert som ${currentWatchedStatus ? "usett" : "sett"}`,
				className: currentWatchedStatus ? "bg-yellow-600" : "bg-green-800",
			});
		} catch (error) {
			console.error("Error toggling watched status:", error);
			toast({
				title: "Error",
				description: "Could not update watched status",
				variant: "destructive",
			});
		}
	};

	useEffect(() => {
		if (user) {
			fetchLists();
		}
	}, [fetchLists, user]);

	useEffect(() => {
		if (selectedList) {
			fetchMovies();
		}
	}, [selectedList, fetchMovies]);

	useEffect(() => {
		const handleMovieListUpdate = (event: CustomEvent<MovieListAction>) => {
			const { type, listId: updatedListId } = event.detail;

			// Only refresh if the update affects this list
			if (updatedListId === selectedList) {
				fetchMovies();
			}
		};

		window.addEventListener("movieListUpdate", handleMovieListUpdate as EventListener);
		return () => {
			window.removeEventListener("movieListUpdate", handleMovieListUpdate as EventListener);
		};
	}, [selectedList, fetchMovies]);

	return (
		<div>
			{isLoading || !selectedList || !movies ? ( // Updated condition to include !movies
				<div className="space-y-6">
					<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
						<Skeleton className="h-9 w-40" />
						<Select disabled>
							<SelectTrigger className="w-[200px]">
								<SelectValue placeholder="Laster lister..." />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="loading">Laster...</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<Tabs defaultValue="all" className="w-full">
						<TabsList className="mb-6 w-[200px]">
							<Skeleton className="w-1/3" />
							<Skeleton className="w-1/3" />
							<Skeleton className="w-1/3" />
						</TabsList>

						{["all", "unwatched", "watched"].map((tab) => (
							<TabsContent key={tab} value={tab}>
								<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
									{Array.from({ length: 10 }).map((_, index) => (
										<div key={index} className="space-y-2">
											<Skeleton className="aspect-[2/3] w-full" />
										</div>
									))}
								</div>
							</TabsContent>
						))}
					</Tabs>
				</div>
			) : (
				<div className="space-y-6">
					<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
						<h2 className="text-3xl font-bold tracking-tight">Filmlista</h2>
						<Select value={selectedList || undefined} onValueChange={handleListSelection}>
							<SelectTrigger className="w-[200px]">
								<SelectValue placeholder="Velg en liste" />
							</SelectTrigger>
							<SelectContent>
								{lists.owned.length > 0 || lists.shared.length > 0 ? (
									<>
										{lists.owned.length > 0 && (
											<>
												<SelectItem value="_header_owned" disabled className="font-semibold">
													Mine lister
												</SelectItem>
												{lists.owned.map((list) => (
													<SelectItem key={list.id} value={list.id}>
														{list.name}
													</SelectItem>
												))}
											</>
										)}
										{lists.shared.length > 0 && (
											<>
												<SelectItem value="_header_shared" disabled className="font-semibold">
													Delt med meg
												</SelectItem>
												{lists.shared.map((list) => (
													<SelectItem key={list.id} value={list.id}>
														{list.name}
													</SelectItem>
												))}
											</>
										)}
									</>
								) : (
									<SelectItem value="_no_lists" disabled>
										Ingen lister tilgjengelig
									</SelectItem>
								)}
							</SelectContent>
						</Select>
					</div>

					{!movies || movies.length === 0 ? (
						<div className="text-center pt-16 sm:py-32 flex flex-col items-center">
							<Film className="h-16 w-16 mb-4 opacity-50" />
							<h3 className="text-lg font-semibold">Ingen filmer i denne lista enda</h3>
							<p className="text-muted-foreground">Legg til filmer for å bygge din filmliste!</p>
						</div>
					) : (
						<Tabs defaultValue="all" className="w-full">
							<TabsList className="mb-6">
								<TabsTrigger value="all">Alle</TabsTrigger>
								<TabsTrigger value="unwatched">Ikke sett</TabsTrigger>
								<TabsTrigger value="watched">Sett</TabsTrigger>
							</TabsList>

							<TabsContent value="all">
								<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
									{movies.map((movie) => (
										<MovieCard
											key={movie.id}
											movie={movie}
											isInList={true}
											lists={lists}
											onRemoveFromList={(listId) => handleRemoveFromList(listId, movie.id, movie.title)}
											onToggleWatched={() => handleToggleWatched(movie.id, movie.is_watched_by_me)}
											onClick={() => router.push(`/movie/${movie.movie_id}`)}
											isWatchList={true}
											currentListId={selectedList || undefined}
											showAddedBy={true}
										/>
									))}
								</div>
							</TabsContent>

							<TabsContent value="unwatched">
								<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
									{movies
										.filter((m) => !m.is_watched_by_me)
										.map((movie) => (
											<MovieCard
												key={movie.id}
												movie={movie}
												isInList={true}
												lists={lists}
												onRemoveFromList={(listId) => handleRemoveFromList(listId, movie.id, movie.title)}
												onToggleWatched={() => handleToggleWatched(movie.id, true)}
												onClick={() => router.push(`/movie/${movie.movie_id}`)}
												isWatchList={true}
												currentListId={selectedList || undefined}
												showAddedBy={true}
											/>
										))}
								</div>
							</TabsContent>

							<TabsContent value="watched">
								<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
									{movies
										.filter((m) => m.is_watched_by_me)
										.map((movie) => (
											<MovieCard
												key={movie.id}
												movie={movie}
												isInList={true}
												lists={lists}
												onRemoveFromList={(listId) => handleRemoveFromList(listId, movie.id, movie.title)}
												onToggleWatched={() => handleToggleWatched(movie.id, false)}
												onClick={() => router.push(`/movie/${movie.movie_id}`)}
												isWatchList={true}
												currentListId={selectedList || undefined}
												showAddedBy={true}
											/>
										))}
								</div>
							</TabsContent>
						</Tabs>
					)}
				</div>
			)}
		</div>
	);
}
