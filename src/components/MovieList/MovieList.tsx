"use client";

import { Button } from "@/components/ui/button";
import { useListActions } from "@/contexts/ListActionsContext";
import { TMDBMovie } from "@/types/movie";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
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
    const { lists, getMediaListIds, ensureMediaMembership } = useListActions();

    useEffect(() => {
        if (!isLoading && movies.results.length > 0) {
            ensureMediaMembership(
                movies.results.map((movie) => movie.id.toString()),
                "movie"
            );
        }
    }, [ensureMediaMembership, isLoading, movies.results]);

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

    return (
        <section className="movie-list h-full w-full max-w-full">
            <h2 className="mb-6 text-3xl font-bold tracking-tight">{title}</h2>

            <div className="w-full max-w-full">
                {isLoading && movies.results.length === 0 ? (
                    <MovieGridSkeleton />
                ) : (
                    <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                        {movies.results.map((movie) => {
                            const mediaId = movie.id.toString();
                            const movieLists = getMediaListIds(mediaId, "movie");

                            return (
                                <MovieCard
                                    key={movie.id}
                                    movie={{
                                        id: mediaId,
                                        movie_id: mediaId,
                                        title: movie.title,
                                        poster_path: movie.poster_path || "",
                                        added_at: "",
                                        added_by: "",
                                        added_by_displayname: undefined,
                                        release_date: movie.release_date,
                                        watched_by: [],
                                        is_watched_by_me: false,
                                    }}
                                    media={{
                                        mediaId,
                                        mediaType: "movie",
                                        title: movie.title,
                                        posterPath: movie.poster_path,
                                        releaseDate: movie.release_date,
                                    }}
                                    isInList={movieLists.length > 0}
                                    listCount={movieLists.length}
                                    lists={lists}
                                    movieLists={movieLists}
                                    onToggleWatched={() => {}}
                                    onClick={() => router.push(`/movie/${movie.id}`)}
                                    isWatchList={false}
                                    showAddedBy={false}
                                />
                            );
                        })}
                    </div>
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
