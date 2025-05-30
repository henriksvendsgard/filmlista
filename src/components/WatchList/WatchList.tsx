"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Movie } from "@/types/movie";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { ArrowRight, Film } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { MovieCard } from "../MovieCard/MovieCard";
import { Skeleton } from "../ui/skeleton";
import { useSupabase } from "@/components/SupabaseProvider";
import Link from "next/link";

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
    release_date: string;
    media_type: string;
    profiles: {
        displayname: string;
        email: string;
    };
}

interface DatabaseWatchedMovie {
    user_id: string;
    movie_id: string;
    watched_at: string;
    media_type: string;
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
    media_type: string;
};

type MovieListAction = {
    type: "added" | "removed";
    listId: string;
    movieId: string;
};

export default function Watchlist() {
    const [isLoadingLists, setIsLoadingLists] = useState(true);
    const [isLoadingMovies, setIsLoadingMovies] = useState(false);
    const [movies, setMovies] = useState<ProcessedMovie[]>([]);
    const [lists, setLists] = useState<{ owned: List[]; shared: List[] }>({ owned: [], shared: [] });
    const [selectedList, setSelectedList] = useState<string | null>(null);

    const supabase = createClientComponentClient();
    const { user } = useSupabase();
    const router = useRouter();
    const searchParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    const listIdFromUrl = searchParams.get("list");

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
        setIsLoadingLists(true);

        try {
            const { data: sharedListIds, error: sharedError } = await supabase
                .from("shared_lists")
                .select("list_id")
                .eq("user_id", user.id);

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
        } finally {
            setIsLoadingLists(false);
        }
    }, [supabase, user, listIdFromUrl, updateUrlWithList, selectedList]);

    const fetchMovies = useCallback(async () => {
        if (!selectedList || !user) return;
        setIsLoadingMovies(true);

        try {
            // Get all media items in the list
            const { data: rawMoviesData, error: moviesError } = await supabase
                .from("media_items")
                .select(
                    `
					movie_id,
					title,
					poster_path,
					added_at,
					added_by,
					release_date,
					media_type,
					profiles (displayname, email)
				`
                )
                .eq("list_id", selectedList)
                .order("added_at", { ascending: false });

            if (moviesError) throw moviesError;

            // Get watched status for all users
            const { data: watchedData, error: watchedError } = await supabase
                .from("watched_media")
                .select("user_id, movie_id, watched_at, media_type")
                .eq("list_id", selectedList);

            if (watchedError) throw watchedError;

            // Get profiles for all users who have watched movies
            const userIds = Array.from(new Set(watchedData?.map((w) => w.user_id) || []));
            const { data: profilesData, error: profilesError } = await supabase
                .from("profiles")
                .select("id, displayname")
                .in("id", userIds);

            if (profilesError) throw profilesError;

            // Create a map of user_id to displayname
            const profileMap = new Map(profilesData?.map((p) => [p.id, p.displayname]) || []);

            const moviesData = rawMoviesData as unknown as DatabaseMovie[];

            // Process movies with watched information
            const processedMovies = moviesData.map((movie) => {
                const watchedByUsers =
                    watchedData
                        ?.filter((w) => w.movie_id === movie.movie_id && w.media_type === movie.media_type)
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
                    release_date: movie.release_date,
                    media_type: movie.media_type,
                    watched_by: watchedByUsers,
                    is_watched_by_me: watchedByUsers.some((w) => w.user_id === user.id),
                };
            });

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
            // Delete the movie from the list
            const { error: removeError } = await supabase
                .from("media_items")
                .delete()
                .eq("list_id", listId)
                .eq("movie_id", movieId)
                .eq("media_type", mediaType);

            if (removeError) throw removeError;

            // Also delete any watched status for this movie in this list
            const { error: watchedError } = await supabase
                .from("watched_media")
                .delete()
                .eq("list_id", listId)
                .eq("movie_id", movieId)
                .eq("media_type", mediaType);

            if (watchedError) throw watchedError;

            // Emit so other components can update
            const event = new CustomEvent("movieListUpdate", {
                detail: {
                    type: "removed",
                    listId,
                    movieId,
                },
            });
            window.dispatchEvent(event);

            // Refresh the list
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
        try {
            if (currentWatchedStatus) {
                // Remove watched status
                const { error } = await supabase
                    .from("watched_media")
                    .delete()
                    .eq("movie_id", movieId)
                    .eq("list_id", selectedList)
                    .eq("user_id", user?.id)
                    .eq("media_type", mediaType);

                if (error) throw error;
            } else {
                // Add watched status
                const { error } = await supabase.from("watched_media").insert({
                    movie_id: movieId,
                    list_id: selectedList,
                    user_id: user?.id,
                    media_type: mediaType,
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
                            <TabsList className="mb-6">
                                <TabsTrigger value="all">Alle</TabsTrigger>
                                <TabsTrigger value="unwatched">Ikke sett</TabsTrigger>
                                <TabsTrigger value="watched">Sett</TabsTrigger>
                            </TabsList>

                            <TabsContent value="all">
                                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                                    {movies.map((movie) => (
                                        <MovieCard
                                            key={movie.id}
                                            movie={movie}
                                            isInList={true}
                                            lists={lists}
                                            onRemoveFromList={(listId) =>
                                                handleRemoveFromList(listId, movie.id, movie.title, movie.media_type)
                                            }
                                            onToggleWatched={(currentWatchedStatus) =>
                                                handleToggleWatched(movie.id, currentWatchedStatus, movie.media_type)
                                            }
                                            onClick={() =>
                                                router.push(
                                                    `/${movie.media_type === "movie" ? "movie" : "tvshow"}/${movie.movie_id}`
                                                )
                                            }
                                            isWatchList={true}
                                            currentListId={selectedList || undefined}
                                            showAddedBy={true}
                                        />
                                    ))}
                                </div>
                            </TabsContent>

                            <TabsContent value="unwatched">
                                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                                    {movies
                                        .filter((m) => !m.is_watched_by_me)
                                        .map((movie) => (
                                            <MovieCard
                                                key={movie.id}
                                                movie={movie}
                                                isInList={true}
                                                lists={lists}
                                                onRemoveFromList={(listId) =>
                                                    handleRemoveFromList(
                                                        listId,
                                                        movie.id,
                                                        movie.title,
                                                        movie.media_type
                                                    )
                                                }
                                                onToggleWatched={(currentWatchedStatus) =>
                                                    handleToggleWatched(
                                                        movie.id,
                                                        currentWatchedStatus,
                                                        movie.media_type
                                                    )
                                                }
                                                onClick={() =>
                                                    router.push(
                                                        `/${movie.media_type === "movie" ? "movie" : "tvshow"}/${movie.movie_id}`
                                                    )
                                                }
                                                isWatchList={true}
                                                currentListId={selectedList || undefined}
                                                showAddedBy={true}
                                            />
                                        ))}
                                </div>
                            </TabsContent>

                            <TabsContent value="watched">
                                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                                    {movies
                                        .filter((m) => m.is_watched_by_me)
                                        .map((movie) => (
                                            <MovieCard
                                                key={movie.id}
                                                movie={movie}
                                                isInList={true}
                                                lists={lists}
                                                onRemoveFromList={(listId) =>
                                                    handleRemoveFromList(
                                                        listId,
                                                        movie.id,
                                                        movie.title,
                                                        movie.media_type
                                                    )
                                                }
                                                onToggleWatched={(currentWatchedStatus) =>
                                                    handleToggleWatched(
                                                        movie.id,
                                                        currentWatchedStatus,
                                                        movie.media_type
                                                    )
                                                }
                                                onClick={() =>
                                                    router.push(
                                                        `/${movie.media_type === "movie" ? "movie" : "tvshow"}/${movie.movie_id}`
                                                    )
                                                }
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
