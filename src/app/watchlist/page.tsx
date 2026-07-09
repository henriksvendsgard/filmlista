"use client";

import MovieList from "@/components/MovieList/MovieList";
import WatchList from "@/components/WatchList/WatchList";
import { getUpcomingMovies } from "@/lib/getMovies";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface ContentResults {
    results: any[];
    total_pages: number;
    page: number;
    total_results: number;
}

export default function WatchlistPage() {
    const [upcomingMovies, setUpcomingMovies] = useState<ContentResults | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    const fetchUpcomingMovies = useCallback(async (page: number, isLoadingMore = false) => {
        if (!isLoadingMore) {
            setIsLoading(true);
        }
        try {
            const movieData = await getUpcomingMovies(page);

            if (isLoadingMore) {
                setUpcomingMovies((prev: ContentResults | null) =>
                    prev
                        ? {
                              ...movieData,
                              results: [...prev.results, ...movieData.results],
                          }
                        : movieData
                );
            } else {
                setUpcomingMovies(movieData);
            }
        } catch (error) {
            console.error("Error fetching upcoming movies:", error);
        } finally {
            setIsLoading(false);
            setIsFetchingMore(false);
        }
    }, []);

    useEffect(() => {
        fetchUpcomingMovies(1);
    }, [fetchUpcomingMovies]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const first = entries[0];
                if (
                    first.isIntersecting &&
                    upcomingMovies &&
                    !isFetchingMore &&
                    upcomingMovies.page < upcomingMovies.total_pages
                ) {
                    setIsFetchingMore(true);
                    fetchUpcomingMovies(upcomingMovies.page + 1, true);
                }
            },
            { threshold: 0.1 }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [fetchUpcomingMovies, isFetchingMore, upcomingMovies]);

    return (
        <div className="container mx-auto px-5 pb-12 lg:px-10">
            <WatchList />

            <section className="mt-16 border-t border-border/60 pt-12">
                <div className="mb-6 space-y-2">
                    <p className="text-sm font-medium uppercase tracking-[0.2em] text-filmlista-primary">
                        Inspirasjon
                    </p>
                    <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
                        Kommende filmer
                    </h2>
                    <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                        Nye filmer — kanskje noe du vil legge til i lista?
                    </p>
                </div>

                {upcomingMovies && (
                    <MovieList title="Kommende filmer" movies={upcomingMovies} isLoading={isLoading} hideTitle />
                )}

                <div ref={loadMoreRef} className="flex h-10 w-full items-center justify-center">
                    {isFetchingMore && <Loader2 className="h-8 w-8 animate-spin text-filmlista-primary" />}
                </div>
            </section>
        </div>
    );
}
