"use client";

import MovieList from "@/components/MovieList/MovieList";
import WatchList from "@/components/WatchList/WatchList";
import { getUpcomingMovies } from "@/lib/getMovies";
import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

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
        <div className="container mx-auto px-5 pb-8 transition-all duration-300 lg:px-10">
            <WatchList />
            <div className="mt-[300px] lg:mt-[300px]">
                {upcomingMovies && <MovieList title="Kommende filmer" movies={upcomingMovies} isLoading={isLoading} />}
                <div ref={loadMoreRef} className="flex h-10 w-full items-center justify-center">
                    {isFetchingMore && <Loader2 className="h-10 w-10 animate-spin text-filmlista-primary" />}
                </div>
            </div>
        </div>
    );
}
