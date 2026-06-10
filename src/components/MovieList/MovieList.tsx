"use client";

import { Button } from "@/components/ui/button";
import { addToList, getLists, getListsForMediaBatch, List, removeFromList } from "@/lib/listRepository";
import { TMDBMovie } from "@/types/movie";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { MovieCard } from "../MovieCard/MovieCard";
import { MovieGridSkeleton } from "./MovieCardSkeleton";

interface MovieListProps {
    movies: {
        results: TMDBMovie[];
        total_pages: number;
        page: number;
        total_results: number;
    };
    title: string;
    isOnFrontPage?: boolean;
    isLoading?: boolean;
    onPageChange?: (page: number) => void;
    currentPage?: number;
}

type MovieListAction = {
    type: "added" | "removed";
    listId: string;
    movieId: string;
};

export default function MovieList({
    movies,
    title,
    isOnFrontPage,
    isLoading,
    onPageChange,
    currentPage,
}: MovieListProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [lists, setLists] = useState<{ owned: List[]; shared: List[] }>({ owned: [], shared: [] });
    const [movieListMap, setMovieListMap] = useState<{ [key: string]: string[] }>({});

    const supabase = createClientComponentClient();

    const fetchLists = useCallback(async () => {
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();
        if (userError) {
            console.error("Error fetching user:", userError);
            return;
        }
        if (!user) return;

        try {
            const result = await getLists(supabase, user.id);
            setLists(result);
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
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) return;

            await addToList(supabase, {
                mediaId: movie.id.toString(),
                listId,
                mediaType: "movie",
                title: movie.title,
                posterPath: movie.poster_path,
                addedBy: user.id,
                releaseDate: movie.release_date,
            });

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
                title: "Film lagt til",
                description: `"${movie.title}" er nå lagt til i "${lists.owned.find((list) => list.id === listId)?.name}"`,
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
            await removeFromList(supabase, {
                mediaId: movie.id.toString(),
                listId,
                mediaType: "movie",
            });

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
                title: "Film fjernet",
                description: `"${movie.title}" er nå fjernet fra "${lists.owned.find((list) => list.id === listId)?.name}"`,
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
        if (onPageChange) {
            onPageChange(pageNumber);
        } else {
            router.push(createPageURL(pageNumber));
            window.scrollTo({
                top: 0,
                behavior: "smooth",
            });
        }
    };

    const fetchMovieListMap = useCallback(async () => {
        if (!movies.results.length) return;

        try {
            const movieMap = await getListsForMediaBatch(
                supabase,
                movies.results.map((m) => m.id.toString()),
                "movie"
            );
            setMovieListMap(movieMap);
        } catch (error) {
            console.error("Error fetching movie list map:", error);
        }
    }, [supabase, movies.results]);

    // Initial data fetch
    useEffect(() => {
        fetchLists();
    }, [fetchLists]);

    // Update list mapping when movies change
    useEffect(() => {
        if (!isLoading) {
            fetchMovieListMap();
        }
    }, [fetchMovieListMap, movies.results, isLoading]);

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
        <section className="movie-list h-full w-full max-w-full">
            <h2 className="mb-6 text-3xl font-bold tracking-tight">{title}</h2>

            <div className="w-full max-w-full">
                {isLoading ? (
                    <MovieGridSkeleton />
                ) : (
                    <>
                        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                            {movies.results.map((movie) => (
                                <MovieCard
                                    key={movie.id}
                                    movie={{
                                        id: movie.id.toString(),
                                        movie_id: movie.id.toString(),
                                        title: movie.title,
                                        poster_path: movie.poster_path || "",
                                        added_at: "",
                                        added_by: "",
                                        added_by_displayname: undefined,
                                        release_date: movie.release_date,
                                        watched_by: [],
                                        is_watched_by_me: false,
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
                    </>
                )}
            </div>

            {isOnFrontPage && movies.total_pages > 1 && !isLoading && (
                <div className="mb-12 mt-8 flex items-center justify-center gap-6">
                    <Button
                        variant="outline"
                        onClick={() => paginate((currentPage || movies.page) - 1)}
                        disabled={(currentPage || movies.page) === 1}
                        className="h-10"
                    >
                        <ChevronLeft className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Forrige</span>
                    </Button>

                    <div className="flex items-center">
                        <span className="text-sm">Side {currentPage || movies.page}</span>
                    </div>

                    <Button
                        variant="outline"
                        onClick={() => paginate((currentPage || movies.page) + 1)}
                        disabled={(currentPage || movies.page) === Math.min(movies.total_pages, 500)}
                        className="h-10"
                    >
                        <span className="hidden sm:inline">Neste</span>
                        <ChevronRight className="h-4 w-4 sm:ml-2" />
                    </Button>
                </div>
            )}
        </section>
    );
}
