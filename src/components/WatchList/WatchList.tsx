"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import {
    getLists,
    getMediaForList,
    MediaEntry,
    removeFromList,
    toggleWatched,
} from "@/lib/listRepository";
import { Movie } from "@/types/movie";
import { ArrowRight, Film } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { MovieCard } from "../MovieCard/MovieCard";
import { Skeleton } from "../ui/skeleton";
import { useSupabase } from "@/components/SupabaseProvider";
import Link from "next/link";
import { useStreamingServices } from "@/hooks/useStreamingServices";
import { fetchWatchProvidersBatch, matchesUserServices, WatchProvidersNO } from "@/lib/watchProviders";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface List {
    id: string;
    name: string;
    owner_id: string;
}

type ProcessedMovie = Movie & {
    provider_ids: number[];
    watched_by: {
        user_id: string;
        displayname: string;
        watched_at: string;
    }[];
    is_watched_by_me: boolean;
    media_type: string;
};

type MovieListAction = {
    type: "added" | "removed";
    listId: string;
    movieId: string;
};

function MovieGrid({
    movies,
    lists,
    selectedList,
    streamingFilter,
    hasServices,
    onRemoveFromList,
    onToggleWatched,
    router,
}: {
    movies: ProcessedMovie[];
    lists: { owned: List[]; shared: List[] };
    selectedList: string;
    streamingFilter: boolean;
    hasServices: boolean;
    onRemoveFromList: (listId: string, movieId: string, movieTitle: string, mediaType: string) => void;
    onToggleWatched: (movieId: string, currentWatchedStatus: boolean, mediaType: string) => void;
    router: ReturnType<typeof useRouter>;
}) {
    if (movies.length === 0 && streamingFilter && hasServices) {
        return (
            <div className="flex flex-col items-center py-16 text-center">
                <Film className="mb-4 h-12 w-12 opacity-50" />
                <h3 className="text-lg font-semibold">Ingen titler på dine tjenester</h3>
                <p className="text-muted-foreground">
                    Prøv å fjerne filteret eller legg til flere tjenester i{" "}
                    <Link href="/profile" className="underline hover:text-foreground">
                        profilen
                    </Link>
                    .
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {movies.map((movie) => (
                <MovieCard
                    key={movie.id}
                    movie={movie}
                    isInList={true}
                    lists={lists}
                    onRemoveFromList={(listId) =>
                        onRemoveFromList(listId, movie.id, movie.title, movie.media_type)
                    }
                    onToggleWatched={(currentWatchedStatus) =>
                        onToggleWatched(movie.id, currentWatchedStatus, movie.media_type)
                    }
                    onClick={() =>
                        router.push(
                            `/${movie.media_type === "movie" ? "movie" : "tvshow"}/${movie.movie_id}`
                        )
                    }
                    isWatchList={true}
                    currentListId={selectedList}
                    showAddedBy={true}
                />
            ))}
        </div>
    );
}

export default function Watchlist() {
    const [isLoadingLists, setIsLoadingLists] = useState(true);
    const [isLoadingMovies, setIsLoadingMovies] = useState(false);
    const [movies, setMovies] = useState<ProcessedMovie[]>([]);
    const [lists, setLists] = useState<{ owned: List[]; shared: List[] }>({ owned: [], shared: [] });
    const [selectedList, setSelectedList] = useState<string | null>(null);

    const { supabase, user } = useSupabase();
    const router = useRouter();
    const { services, hasServices, isLoading: isLoadingServices } = useStreamingServices();
    const [streamingFilter, setStreamingFilter] = useState(false);
    const [isLoadingProviders, setIsLoadingProviders] = useState(false);
    const [providerMap, setProviderMap] = useState<Map<string, WatchProvidersNO | null>>(new Map());
    const searchParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    const listIdFromUrl = searchParams.get("list");

    const updateUrlWithList = useCallback(
        (listId: string | null) => {
            const newUrl = listId ? `${window.location.pathname}?list=${listId}` : window.location.pathname;
            router.replace(newUrl);
        },
        [router]
    );

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
        setIsLoadingLists(true);

        try {
            const result = await getLists(supabase, user.id);
            setLists(result);

            if (!selectedList) {
                const initialList = listIdFromUrl || result.owned[0]?.id || result.shared[0]?.id;
                if (initialList) {
                    setSelectedList(initialList);
                    if (!listIdFromUrl) updateUrlWithList(initialList);
                }
            }
        } catch (error) {
            console.error("Error fetching lists:", error);
            toast({
                title: "Error",
                description: "Failed to fetch lists",
                variant: "destructive",
            });
        } finally {
            setIsLoadingLists(false);
        }
    }, [supabase, user, listIdFromUrl, updateUrlWithList, selectedList]);

    const fetchMovies = useCallback(async () => {
        if (!selectedList || !user) return;
        setIsLoadingMovies(true);

        try {
            const entries = await getMediaForList(supabase, selectedList, user.id);
            const processedMovies = entries.map((entry: MediaEntry) => ({
                id: entry.mediaId,
                movie_id: entry.mediaId,
                title: entry.title,
                poster_path: entry.posterPath,
                added_at: entry.addedAt,
                added_by: entry.addedBy,
                added_by_displayname: entry.addedByDisplayname,
                release_date: entry.releaseDate,
                media_type: entry.mediaType,
                provider_ids: entry.providerIds,
                watched_by: entry.watchedBy.map((w) => ({
                    user_id: w.userId,
                    displayname: w.displayname,
                    watched_at: w.watchedAt,
                })),
                is_watched_by_me: entry.isWatchedByMe,
            }));
            setMovies(processedMovies);
        } catch (error) {
            console.error("Error fetching movies:", error);
            setMovies([]);
        } finally {
            setIsLoadingMovies(false);
        }
    }, [selectedList, supabase, user]);

    const handleRemoveFromList = async (listId: string, movieId: string, movieTitle: string, mediaType: string) => {
        try {
            await removeFromList(supabase, {
                mediaId: movieId,
                listId,
                mediaType: mediaType as "movie" | "tv",
                alsoRemoveWatched: true,
            });

            const event = new CustomEvent("movieListUpdate", {
                detail: { type: "removed", listId, movieId },
            });
            window.dispatchEvent(event);

            fetchMovies();

            toast({
                title: mediaType === "movie" ? "Film fjernet" : "TV-serie fjernet",
                description: `"${movieTitle}" er fjernet fra listen`,
                className: "bg-orange-800",
            });
        } catch (error) {
            console.error("Error removing from list:", error);
            toast({
                title: "Feil",
                description: "Kunne ikke fjerne fra listen",
                variant: "destructive",
            });
        }
    };

    const handleToggleWatched = async (movieId: string, currentWatchedStatus: boolean, mediaType: string) => {
        if (!user || !selectedList) return;
        try {
            await toggleWatched(supabase, {
                mediaId: movieId,
                listId: selectedList,
                userId: user.id,
                mediaType: mediaType as "movie" | "tv",
                isWatched: currentWatchedStatus,
            });

            setMovies(
                movies.map((movie) => {
                    if (movie.movie_id === movieId) {
                        const updatedWatchedBy = currentWatchedStatus
                            ? movie.watched_by.filter((w) => w.user_id !== user.id)
                            : [
                                  ...movie.watched_by,
                                  {
                                      user_id: user.id,
                                      displayname: user.user_metadata?.displayname || "Unknown",
                                      watched_at: new Date().toISOString(),
                                  },
                              ];
                        return { ...movie, watched_by: updatedWatchedBy, is_watched_by_me: !currentWatchedStatus };
                    }
                    return movie;
                })
            );

            toast({
                title: currentWatchedStatus ? "Markert som usett" : "Markert som sett",
                description: `${mediaType === "movie" ? "Filmen" : "TV-serien"} er nå markert som ${currentWatchedStatus ? "usett" : "sett"}`,
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
        } else {
            setIsLoadingLists(false);
        }
    }, [fetchLists, user]);

    useEffect(() => {
        if (selectedList) {
            fetchMovies();
        }
    }, [selectedList, fetchMovies]);

    useEffect(() => {
        if (!streamingFilter || !hasServices || movies.length === 0) {
            setProviderMap(new Map());
            return;
        }

        const itemsNeedingFetch = movies.filter((movie) => movie.provider_ids.length === 0);
        if (itemsNeedingFetch.length === 0) {
            setProviderMap(new Map());
            return;
        }

        const fetchProviders = async () => {
            setIsLoadingProviders(true);
            try {
                const items = itemsNeedingFetch.map((m) => ({
                    mediaId: m.movie_id,
                    mediaType: m.media_type as "movie" | "tv",
                }));
                const providers = await fetchWatchProvidersBatch(items);
                setProviderMap(providers);
            } catch (error) {
                console.error("Error fetching watch providers:", error);
            } finally {
                setIsLoadingProviders(false);
            }
        };

        fetchProviders();
    }, [streamingFilter, hasServices, movies]);

    const filterByStreaming = useCallback(
        (movieList: ProcessedMovie[]) => {
            if (!streamingFilter || !hasServices) return movieList;

            return movieList.filter((movie) => {
                if (movie.provider_ids.length > 0) {
                    return movie.provider_ids.some((id) => services.includes(id));
                }

                const key = `${movie.media_type}:${movie.movie_id}`;
                const providers = providerMap.get(key);
                if (providers === undefined) return false;
                return matchesUserServices(providers, services);
            });
        },
        [streamingFilter, hasServices, providerMap, services]
    );

    useEffect(() => {
        const handleMovieListUpdate = (event: CustomEvent<MovieListAction>) => {
            const { listId: updatedListId } = event.detail;
            if (updatedListId === selectedList) {
                fetchMovies();
            }
        };

        window.addEventListener("movieListUpdate", handleMovieListUpdate as EventListener);
        return () => {
            window.removeEventListener("movieListUpdate", handleMovieListUpdate as EventListener);
        };
    }, [selectedList, fetchMovies]);

    const isLoading = isLoadingLists || isLoadingMovies;

    return (
        <div>
            <h2 className="mb-6 text-3xl font-bold tracking-tight">Filmlista</h2>

            {isLoading ? (
                <div className="space-y-6">
                    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                        <Skeleton className="h-9 w-52" />
                    </div>

                    <Tabs defaultValue="all" className="w-full">
                        <TabsList className="mb-6 w-[200px]">
                            <Skeleton className="w-1/3" />
                            <Skeleton className="w-1/3" />
                            <Skeleton className="w-1/3" />
                        </TabsList>

                        {["all", "unwatched", "watched"].map((tab) => (
                            <TabsContent key={tab} value={tab}>
                                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
                    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
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

                    {!isLoading && (
                        <>
                            {lists.owned.length === 0 && lists.shared.length === 0 ? (
                                <div className="flex flex-col items-center pt-16 text-center sm:py-32">
                                    <Film className="mb-4 h-16 w-16 opacity-50" />
                                    <h3 className="text-lg font-semibold">Du har ingen lister enda</h3>
                                    <p className="text-muted-foreground">Opprett en liste for å komme i gang!</p>
                                    <Link
                                        href="/lists"
                                        className="mt-8 flex items-center rounded-full bg-filmlista-primary px-4 py-2 text-white transition-colors hover:bg-filmlista-primary/80"
                                    >
                                        Opprett en liste
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </div>
                            ) : selectedList && !isLoadingMovies && (!movies || movies.length === 0) ? (
                                <div className="flex flex-col items-center pt-16 text-center sm:py-32">
                                    <Film className="mb-4 h-16 w-16 opacity-50" />
                                    <h3 className="text-lg font-semibold">Ingen filmer i denne lista enda</h3>
                                    <p className="text-muted-foreground">Legg til filmer for å bygge din filmliste!</p>
                                </div>
                            ) : null}
                        </>
                    )}

                    {selectedList && movies && movies.length > 0 && !isLoading && (
                        <Tabs defaultValue="all" className="w-full">
                            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <TabsList>
                                    <TabsTrigger value="all">Alle</TabsTrigger>
                                    <TabsTrigger value="unwatched">Ikke sett</TabsTrigger>
                                    <TabsTrigger value="watched">Sett</TabsTrigger>
                                </TabsList>

                                {!isLoadingServices && (
                                    <div className="flex items-center gap-2">
                                        {hasServices ? (
                                            <>
                                                <Checkbox
                                                    id="streaming-filter"
                                                    checked={streamingFilter}
                                                    onCheckedChange={(checked) =>
                                                        setStreamingFilter(checked === true)
                                                    }
                                                    disabled={isLoadingProviders}
                                                />
                                                <Label htmlFor="streaming-filter" className="cursor-pointer text-sm">
                                                    På mine tjenester
                                                </Label>
                                                {isLoadingProviders && (
                                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                )}
                                            </>
                                        ) : (
                                            <Link
                                                href="/profile"
                                                className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                                            >
                                                Legg til strømmetjenester i profilen
                                            </Link>
                                        )}
                                    </div>
                                )}
                            </div>

                            {streamingFilter && hasServices && isLoadingProviders && providerMap.size === 0 && movies.some((m) => m.provider_ids.length === 0) ? (
                                <div className="flex items-center justify-center py-16">
                                    <Loader2 className="h-8 w-8 animate-spin text-filmlista-primary" />
                                </div>
                            ) : (
                                <>
                            <TabsContent value="all">
                                <MovieGrid
                                    movies={filterByStreaming(movies)}
                                    lists={lists}
                                    selectedList={selectedList}
                                    streamingFilter={streamingFilter}
                                    hasServices={hasServices}
                                    onRemoveFromList={handleRemoveFromList}
                                    onToggleWatched={handleToggleWatched}
                                    router={router}
                                />
                            </TabsContent>

                            <TabsContent value="unwatched">
                                <MovieGrid
                                    movies={filterByStreaming(movies.filter((m) => !m.is_watched_by_me))}
                                    lists={lists}
                                    selectedList={selectedList}
                                    streamingFilter={streamingFilter}
                                    hasServices={hasServices}
                                    onRemoveFromList={handleRemoveFromList}
                                    onToggleWatched={handleToggleWatched}
                                    router={router}
                                />
                            </TabsContent>

                            <TabsContent value="watched">
                                <MovieGrid
                                    movies={filterByStreaming(movies.filter((m) => m.is_watched_by_me))}
                                    lists={lists}
                                    selectedList={selectedList}
                                    streamingFilter={streamingFilter}
                                    hasServices={hasServices}
                                    onRemoveFromList={handleRemoveFromList}
                                    onToggleWatched={handleToggleWatched}
                                    router={router}
                                />
                            </TabsContent>
                                </>
                            )}
                        </Tabs>
                    )}
                </div>
            )}
        </div>
    );
}
