"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Movie } from "@/types/movie";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Film } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MovieCard } from "../MovieCard/MovieCard";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";

interface List {
	id: string;
	name: string;
	owner_id: string;
}

interface WatchListMovie {
	movie_id: string;
	title: string;
	poster_path: string;
	watched: boolean;
	added_at: string;
	added_by: string;
	profiles: {
		email: string;
	};
}

type MovieListAction = {
	type: "added" | "removed";
	listId: string;
	movieId: string;
};

export default function Watchlist() {
	const [isLoading, setIsLoading] = useState(true);
	const [movies, setMovies] = useState<Movie[]>([]);
	const [lists, setLists] = useState<{ owned: List[]; shared: List[] }>({ owned: [], shared: [] });
	const [selectedList, setSelectedList] = useState<string | null>(null);

	const supabase = createClientComponentClient();
	const router = useRouter();

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

			// Setter den første listen som valgt som default
			if (!selectedList && (ownedLists.length > 0 || sharedLists.length > 0)) {
				setSelectedList(ownedLists[0]?.id || sharedLists[0]?.id);
			}
		} catch (error) {
			console.error("Error fetching lists:", error);
			toast({
				title: "Error",
				description: "Failed to fetch lists",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	// Hent filmer fra valgt liste
	const fetchMovies = async () => {
		try {
			const { data, error } = await supabase
				.from("list_movies")
				.select(
					`
					movie_id,
					title,
					poster_path,
					watched,
					added_at,
					added_by,
					profiles (email)
				`
				)
				.eq("list_id", selectedList)
				.order("added_at", { ascending: false });

			if (error) throw error;

			const typedData = data as unknown as WatchListMovie[];

			const processedMovies = typedData.map((item) => ({
				id: item.movie_id,
				movie_id: item.movie_id,
				title: item.title,
				poster_path: item.poster_path,
				watched: item.watched || false,
				added_at: item.added_at,
				added_by: item.added_by,
				added_by_email: item.profiles.email,
			}));

			setMovies(processedMovies);
		} catch (error) {
			console.error("Error fetching movies:", error);
			setMovies([]);
		} finally {
			setIsLoading(false);
		}
	};

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
				description: `${movieTitle} er fjernet fra listen`,
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
			const { error } = await supabase.from("list_movies").update({ watched: !currentWatchedStatus }).eq("movie_id", movieId).eq("list_id", selectedList);

			if (error) throw error;

			// Update local state
			setMovies(movies.map((movie) => (movie.movie_id === movieId ? { ...movie, watched: !movie.watched } : movie)));

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
		fetchLists();
	}, []);

	useEffect(() => {
		if (selectedList) {
			fetchMovies();
		}
	}, [selectedList]);

	useEffect(() => {
		const handleMovieListUpdate = (event: CustomEvent<MovieListAction>) => {
			const { type, listId: updatedListId } = event.detail;

			// Only refresh if the update affects this list
			if (updatedListId === selectedList) {
				fetchMovies();
			}
		};

		// Add event listener
		window.addEventListener("movieListUpdate", handleMovieListUpdate as EventListener);

		// Cleanup
		return () => {
			window.removeEventListener("movieListUpdate", handleMovieListUpdate as EventListener);
		};
	}, [selectedList, fetchMovies]);

	return (
		<div>
			{isLoading ? (
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
											<Skeleton className="h-[225px] sm:h-[350px] w-full" />
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
						<Select value={selectedList || undefined} onValueChange={setSelectedList}>
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
					{movies.length > 0 && (
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
											onToggleWatched={() => handleToggleWatched(movie.id, movie.watched)}
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
										.filter((m) => !m.watched)
										.map((movie) => (
											<MovieCard
												key={movie.id}
												movie={movie}
												isInList={true}
												lists={lists}
												onRemoveFromList={(listId) => handleRemoveFromList(listId, movie.id, movie.title)}
												onToggleWatched={() => handleToggleWatched(movie.id, movie.watched)}
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
										.filter((m) => m.watched)
										.map((movie) => (
											<MovieCard
												key={movie.id}
												movie={movie}
												isInList={true}
												lists={lists}
												onRemoveFromList={(listId) => handleRemoveFromList(listId, movie.id, movie.title)}
												onToggleWatched={() => handleToggleWatched(movie.id, movie.watched)}
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

					{!selectedList && (
						<div className="text-center py-10">
							<h3 className="text-xl font-semibold mb-4">Du har ingen lister</h3>
							<p className="text-muted-foreground">Lag en liste for å legge til filmer</p>
							<Button onClick={() => router.push("/lists")} className="mt-10">
								Lag en liste
							</Button>
						</div>
					)}

					{selectedList && !movies && (
						<div className="text-center py-10 flex flex-col items-center">
							<Film className="h-16 w-16 mb-4 opacity-50" />
							<h3 className="text-lg font-semibold">Ingen filmer i denne lista enda</h3>
							<p className="text-muted-foreground">Legg til filmer for å bygge din filmliste!</p>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
