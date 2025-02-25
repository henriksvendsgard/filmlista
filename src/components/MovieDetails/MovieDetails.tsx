"use client";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { useMovieLists } from "@/hooks/useMovieLists";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { ArrowLeft, BookmarkPlus, Plus } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface MovieDetails {
	id: number;
	title: string;
	overview: string;
	poster_path: string | null;
	backdrop_path: string | null;
	release_date: string;
	vote_average: number;
	runtime: number | null;
	genres: { id: number; name: string }[];
}

interface SimilarMovie {
	id: number;
	title: string;
	poster_path: string | null;
	vote_average: number;
	release_date: string;
}

interface Cast {
	id: number;
	name: string;
	character: string;
	profile_path: string | null;
}

interface WatchProvider {
	provider_name: string;
	logo_path: string;
}

interface WatchProviders {
	rent?: WatchProvider[];
	buy?: WatchProvider[];
	flatrate?: WatchProvider[];
}

interface MovieDetailProps {
	params: {
		id: string;
	};
}

export default function MovieDetails({ params }: MovieDetailProps) {
	const movieId = params.id;
	const router = useRouter();
	const [movie, setMovie] = useState<MovieDetails | null>(null);
	const [cast, setCast] = useState<Cast[]>([]);
	const [similarMovies, setSimilarMovies] = useState<SimilarMovie[]>([]);
	const [watchProviders, setWatchProviders] = useState<WatchProviders | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const { lists } = useMovieLists();
	const [movieListMap, setMovieListMap] = useState<Record<string, string[]>>({});
	const [listsWithMovie, setListsWithMovie] = useState<any[]>([]);

	const supabase = createClientComponentClient();

	const fetchMovieListMap = useCallback(async () => {
		try {
			const { data, error } = await supabase.from("media_items").select("list_id").eq("movie_id", movieId).eq("media_type", "movie");

			if (error) throw error;

			const listIds = data.map((item) => item.list_id);
			setMovieListMap({ [movieId]: listIds });

			if (listIds.length > 0) {
				const { data: listData, error: listError } = await supabase.from("lists").select("*").in("id", listIds);

				if (listError) throw listError;
				setListsWithMovie(listData || []);
			} else {
				setListsWithMovie([]);
			}
		} catch (error) {
			console.error("Error fetching movie lists:", error);
		}
	}, [movieId, supabase]);

	useEffect(() => {
		const fetchMovieData = async () => {
			if (!process.env.NEXT_PUBLIC_TMDB_API_KEY) {
				setError("API key is not configured");
				setLoading(false);
				return;
			}

			try {
				// First fetch movie details, cast, and providers
				const [movieResponse, creditsResponse, providersResponse] = await Promise.all([
					fetch(`https://api.themoviedb.org/3/movie/${params.id}`, {
						headers: {
							Authorization: `Bearer ${process.env.NEXT_PUBLIC_TMDB_API_KEY}`,
							accept: "application/json",
						},
					}),
					fetch(`https://api.themoviedb.org/3/movie/${params.id}/credits`, {
						headers: {
							Authorization: `Bearer ${process.env.NEXT_PUBLIC_TMDB_API_KEY}`,
							accept: "application/json",
						},
					}),
					fetch(`https://api.themoviedb.org/3/movie/${params.id}/watch/providers`, {
						headers: {
							Authorization: `Bearer ${process.env.NEXT_PUBLIC_TMDB_API_KEY}`,
							accept: "application/json",
						},
					}),
				]);

				if (!movieResponse.ok || !creditsResponse.ok || !providersResponse.ok) {
					throw new Error("Failed to fetch movie data");
				}

				const [movieData, creditsData, providersData] = await Promise.all([movieResponse.json(), creditsResponse.json(), providersResponse.json()]);

				setMovie(movieData);
				setCast(creditsData.cast?.slice(0, 6) || []); // First 6 cast members
				setWatchProviders(providersData.results?.NO || null); // Norwegian providers

				// Now fetch similar movies using the movie's genres - get 5 pages to ensure we have enough movies
				const similarMoviesPromises = [1, 2, 3, 4, 5].map((page) =>
					fetch(
						`https://api.themoviedb.org/3/discover/movie?with_genres=${movieData.genres
							.map((g: { id: number }) => g.id)
							.join(",")}&sort_by=popularity.desc&page=${page}&without_genres=99,10755`,
						{
							headers: {
								Authorization: `Bearer ${process.env.NEXT_PUBLIC_TMDB_API_KEY}`,
								accept: "application/json",
							},
						}
					).then((res) => res.json())
				);

				const similarPagesData = await Promise.all(similarMoviesPromises);
				const allSimilarMovies = similarPagesData.flatMap((page) => page.results);

				// Filter out the current movie and take first 100
				const filteredSimilarMovies = allSimilarMovies.filter((m: any) => m.id !== movieData.id).slice(0, 100);

				setSimilarMovies(filteredSimilarMovies);
			} catch (error) {
				console.error("Error:", error);
				setError(error instanceof Error ? error.message : "Klarte ikke hente filmdetaljer");
			} finally {
				setLoading(false);
			}
		};

		fetchMovieData();
	}, [params.id]);

	useEffect(() => {
		fetchMovieListMap();
	}, [fetchMovieListMap]);

	const handleAddToList = async (listId: string) => {
		try {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) return;

			// First, delete any existing watched status for this movie in this list
			const { error: watchedError } = await supabase.from("watched_media").delete().eq("list_id", listId).eq("movie_id", params.id).eq("media_type", "movie");
			if (watchedError) throw watchedError;

			// Then add the movie to the list
			const { error } = await supabase.from("media_items").insert({
				list_id: listId,
				movie_id: params.id,
				title: movie?.title,
				poster_path: movie?.poster_path,
				added_by: user.id,
				release_date: movie?.release_date,
				media_type: "movie",
			});

			if (error) throw error;

			setMovieListMap((prev) => ({
				...prev,
				[params.id]: [...(prev[params.id] || []), listId],
			}));

			// Oppdaterer listsWithMovie
			const newList = [...lists.owned, ...lists.shared].find((l) => l.id === listId);
			if (newList) {
				setListsWithMovie((prev) => [...prev, newList]);
			}

			toast({
				title: "Film lagt til",
				description: `"${movie?.title}" er nå lagt til i "${newList?.name}"`,
				className: "bg-blue-800",
			});
		} catch (error) {
			console.error("Feil ved innlegging av film:", error);
			toast({
				title: "Feil",
				description: "Kunne ikke legge til filmen i listen",
				variant: "destructive",
			});
		}
	};

	const handleRemoveFromList = async (listId: string, listName: string) => {
		try {
			const { error } = await supabase.from("media_items").delete().eq("movie_id", params.id).eq("list_id", listId).eq("media_type", "movie");

			if (error) throw error;

			setMovieListMap((prev) => {
				const newMap = { ...prev };
				if (newMap[params.id]) {
					newMap[params.id] = newMap[params.id].filter((id) => id !== listId);
					if (newMap[params.id].length === 0) {
						delete newMap[params.id];
					}
				}
				return newMap;
			});

			// Oppdater listsWithMovie for å fjerne filmen
			setListsWithMovie((prev) => prev.filter((list) => list.id !== listId));

			toast({
				title: "Film fjernet",
				description: `"${movie?.title}" er nå fjernet fra "${listName}"`,
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

	if (loading) return <MovieDetailsSkeleton />;
	if (error || !movie) return <ErrorState error={error} onBack={() => router.back()} />;

	return (
		<div className="container mx-auto px-5 sm:py-8 space-y-8">
			<Button variant="ghost" onClick={() => router.back()} className="mb-4">
				<ArrowLeft className="mr-2 h-4 w-4" />
				Tilbake
			</Button>

			<div className="relative w-full aspect-[2.76/1] overflow-hidden rounded-xl">
				{movie.backdrop_path ? (
					<Image src={`https://image.tmdb.org/t/p/original${movie.backdrop_path}`} alt={movie.title} fill className="object-cover" priority />
				) : (
					<div className="w-full h-full bg-muted flex items-center justify-center">
						<span className="text-muted-foreground">Ingen bakgrunnsbilde tilgjengelig</span>
					</div>
				)}
			</div>

			<div className="grid gap-8 md:grid-cols-[2fr,1fr]">
				<div className="space-y-8">
					<div className="flex flex-col gap-4 mb-6">
						<h1 className="text-4xl font-bold">{movie.title}</h1>

						<DropdownMenu>
							<DropdownMenuTrigger className="flex-shrink-0" asChild>
								<Button variant={"secondary"} size={"icon"} className="rounded-full w-12 h-12 p-5 bg-filmlista-primary hover:bg-filmlista-hover text-white border-background">
									<BookmarkPlus />
									{/* Legg til */}
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-56">
								{/* Sjekker om det finnes lister å legge til i */}
								{(lists?.owned?.some((list) => !movieListMap[params.id]?.includes(list.id)) || lists?.shared?.some((list) => !movieListMap[params.id]?.includes(list.id))) && (
									<>
										{/* Egne lister */}
										{lists.owned.filter((list) => !movieListMap[params.id]?.includes(list.id)).length > 0 && (
											<>
												<DropdownMenuItem disabled className="text-muted-foreground">
													Dine lister
												</DropdownMenuItem>
												{lists.owned
													.filter((list) => !movieListMap[params.id]?.includes(list.id))
													.map((list) => (
														<DropdownMenuItem key={list.id} onClick={() => handleAddToList(list.id)} className="cursor-pointer">
															Legg til i {list.name}
														</DropdownMenuItem>
													))}
											</>
										)}

										{/* Delte lister */}
										{lists.shared.filter((list) => !movieListMap[params.id]?.includes(list.id)).length > 0 && (
											<>
												{lists.owned.filter((list) => !movieListMap[params.id]?.includes(list.id)).length > 0 && <DropdownMenuSeparator />}
												<DropdownMenuItem disabled className="text-muted-foreground">
													Delte lister
												</DropdownMenuItem>
												{lists.shared
													.filter((list) => !movieListMap[params.id]?.includes(list.id))
													.map((list) => (
														<DropdownMenuItem key={list.id} onClick={() => handleAddToList(list.id)} className="cursor-pointer">
															Legg til i {list.name}
														</DropdownMenuItem>
													))}
											</>
										)}
									</>
								)}

								{/* Lister filmen er i */}
								{listsWithMovie.length > 0 && (
									<>
										{/* Kun vis separator hvis det er liste over */}
										{(lists?.owned?.some((list) => !movieListMap[params.id]?.includes(list.id)) || lists?.shared?.some((list) => !movieListMap[params.id]?.includes(list.id))) && (
											<DropdownMenuSeparator />
										)}
										<DropdownMenuItem disabled className="text-muted-foreground">
											Fjern fra
										</DropdownMenuItem>
										{listsWithMovie.map((list) => (
											<DropdownMenuItem key={list.id} onClick={() => handleRemoveFromList(list.id, list.name)} className="text-red-600 cursor-pointer">
												{list.name}
											</DropdownMenuItem>
										))}
									</>
								)}

								{/* Ingen lister tilgjengelig */}
								{!lists?.owned?.length && !lists?.shared?.length && <DropdownMenuItem disabled>Ingen lister tilgjengelig</DropdownMenuItem>}
							</DropdownMenuContent>
						</DropdownMenu>
					</div>

					<div className="flex flex-wrap items-center gap-x-2 text-muted-foreground">
						{movie.release_date && <span>{new Date(movie.release_date).getFullYear()}</span>}
						{movie.runtime && (
							<>
								<span>•</span>
								<span>{movie.runtime} min</span>
							</>
						)}
						{movie.vote_average && (
							<>
								<span>•</span>
								<span className="flex items-center gap-1">
									{movie.vote_average.toFixed(1)}
									<span className="text-xs">⭐️</span>
								</span>
							</>
						)}
					</div>

					<div className="flex flex-wrap gap-2">
						{movie.genres.map((genre) => (
							<div key={genre.id} className="rounded-full bg-muted px-3 py-1 text-sm">
								{translateGenre(genre.name)}
							</div>
						))}
					</div>

					<p className="text-muted-foreground leading-relaxed">{movie.overview}</p>

					{cast.length > 0 && (
						<div>
							<h2 className="text-2xl font-semibold mb-4">Skuespillere</h2>
							<div className="grid grid-cols-2 md:grid-cols-3 gap-6">
								{cast.map((actor) => (
									<div key={actor.id} className="flex items-center space-x-4">
										<div className="flex-shrink-0 w-12 h-12 relative">
											{actor.profile_path ? (
												<Image src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`} alt={actor.name} fill sizes="50px" className="rounded-full object-cover" />
											) : (
												<div className="w-full h-full rounded-full bg-muted flex items-center justify-center">
													<span className="text-xl">👤</span>
												</div>
											)}
										</div>
										<div className="min-w-0">
											<p className="font-medium truncate">{actor.name}</p>
											<p className="text-sm text-muted-foreground truncate">{actor.character}</p>
										</div>
									</div>
								))}
							</div>
						</div>
					)}
				</div>

				<div>
					<div className="sticky top-8 space-y-8">
						{movie.poster_path ? (
							<Image src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} alt={movie.title} width={300} height={450} className="rounded-lg w-full" priority />
						) : (
							<div className="w-full aspect-[2/3] rounded-lg bg-muted flex items-center justify-center">
								<span className="text-muted-foreground">Ingen plakat tilgjengelig</span>
							</div>
						)}
					</div>
				</div>
			</div>
			{!watchProviders && <h3 className="text-muted-foreground">Fant ikke tilgjengelige strømmetjenester for denne filmen</h3>}
			{watchProviders && (
				<div className="mt-8 space-y-6 border-t pt-8">
					<h2 className="text-2xl font-semibold">Tilgjengelig på</h2>

					<div className="grid gap-8 sm:grid-cols-3">
						{watchProviders.flatrate && (
							<div>
								<h3 className="text-lg font-medium mb-4">Strøm</h3>
								<div className="flex flex-wrap gap-3">
									{watchProviders.flatrate.map((provider) => (
										<div key={provider.provider_name} className="tooltip" data-tip={provider.provider_name}>
											<Image
												src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
												alt={provider.provider_name}
												width={50}
												height={50}
												className="rounded-lg shadow-md hover:shadow-lg transition-shadow"
											/>
										</div>
									))}
								</div>
							</div>
						)}

						{watchProviders.rent && (
							<div>
								<h3 className="text-lg font-medium mb-4">Leie</h3>
								<div className="flex flex-wrap gap-3">
									{watchProviders.rent.map((provider) => (
										<div key={provider.provider_name} className="tooltip" data-tip={provider.provider_name}>
											<Image
												src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
												alt={provider.provider_name}
												width={50}
												height={50}
												className="rounded-lg shadow-md hover:shadow-lg transition-shadow"
											/>
										</div>
									))}
								</div>
							</div>
						)}

						{watchProviders.buy && (
							<div>
								<h3 className="text-lg font-medium mb-4">Kjøp</h3>
								<div className="flex flex-wrap gap-3">
									{watchProviders.buy.map((provider) => (
										<div key={provider.provider_name} className="tooltip" data-tip={provider.provider_name}>
											<Image
												src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
												alt={provider.provider_name}
												width={50}
												height={50}
												className="rounded-lg shadow-md hover:shadow-lg transition-shadow"
											/>
										</div>
									))}
								</div>
							</div>
						)}
					</div>

					{!watchProviders.flatrate && !watchProviders.rent && !watchProviders.buy && (
						<p className="text-muted-foreground">Ikke tilgjengelig på noen strømmetjenester i Norge for øyeblikket.</p>
					)}
				</div>
			)}

			{similarMovies.length > 0 && (
				<div className="mt-8 space-y-6 border-t pt-16">
					<h2 className="text-2xl font-semibold">Lignende filmer</h2>
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
						{similarMovies.map((movie) => (
							<div key={movie.id} className="cursor-pointer group" onClick={() => router.push(`/movie/${movie.id}`)}>
								<div className="relative aspect-[2/3] overflow-hidden rounded-lg">
									{movie.poster_path ? (
										<Image
											src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
											alt={movie.title}
											fill
											className="object-cover transition-transform group-hover:scale-105"
											sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw"
										/>
									) : (
										<div className="w-full h-full bg-muted flex items-center justify-center">
											<span className="text-muted-foreground">Ingen plakat</span>
										</div>
									)}
								</div>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

function ErrorState({ error, onBack }: { error: string | null; onBack: () => void }) {
	return (
		<div className="flex flex-col items-center justify-center p-8 space-y-4">
			<h1 className="text-2xl font-bold text-red-500">Feil</h1>
			<p className="text-muted-foreground">{error || "Fant ikke filmen"}</p>
			<Button variant="outline" onClick={onBack}>
				<ArrowLeft className="mr-2 h-4 w-4" />
				Tilbake
			</Button>
		</div>
	);
}

function MovieDetailsSkeleton() {
	return (
		<div className="container mx-auto px-4 py-8 space-y-8">
			<Skeleton className="h-10 w-20" />
			<Skeleton className="w-full aspect-[2.76/1] rounded-xl" />
			<div className="grid gap-8 md:grid-cols-[2fr,1fr]">
				<div className="space-y-6">
					<div>
						<Skeleton className="h-12 w-3/4 mb-4" />
						<Skeleton className="h-12 w-12 rounded-full mb-10" />
						<Skeleton className="h-4 w-1/2" />
					</div>
					<div className="flex flex-wrap gap-2">
						{[1, 2, 3].map((i) => (
							<Skeleton key={i} className="h-8 w-20 rounded-full" />
						))}
					</div>
					<div className="space-y-2">
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-4 w-3/4" />
					</div>
					<div className="space-y-4">
						<Skeleton className="h-8 w-40" />
						<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
							{[1, 2, 3, 4, 5, 6].map((i) => (
								<div key={i} className="flex items-center space-x-3">
									<Skeleton className="h-[45px] w-[45px] rounded-full" />
									<div className="space-y-2">
										<Skeleton className="h-4 w-24" />
										<Skeleton className="h-3 w-20" />
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
				<div>
					<Skeleton className="aspect-[2/3] w-full rounded-lg" />
				</div>
			</div>
			<div className="space-y-4">
				<Skeleton className="h-8 w-40" />
				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
					{[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
						<div key={i} className="space-y-2">
							<Skeleton className="aspect-[2/3] w-full rounded-lg" />
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

function translateGenre(genre: string): string {
	const genreTranslations: { [key: string]: string } = {
		Action: "Action",
		Adventure: "Eventyr",
		Animation: "Animasjon",
		Comedy: "Komedie",
		Crime: "Krim",
		Documentary: "Dokumentar",
		Drama: "Drama",
		Family: "Familie",
		Fantasy: "Fantasy",
		History: "Historie",
		Horror: "Skrekk",
		Music: "Musikk",
		Mystery: "Mysterie",
		Romance: "Romantikk",
		"Science Fiction": "Science Fiction",
		"TV Movie": "TV-Film",
		Thriller: "Thriller",
		War: "Krig",
		Western: "Western",
	};

	return genreTranslations[genre] || genre;
}
