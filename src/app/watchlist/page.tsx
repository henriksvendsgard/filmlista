"use client";

import MovieList from "@/components/MovieList/MovieList";
import WatchList from "@/components/WatchList/WatchList";
import { getUpcomingMovies } from "@/lib/getMovies";
import {
    getWatchlistEntry,
    getWatchlistKey,
    saveWatchlistScroll,
    updateWatchlistEntry,
} from "@/lib/watchlistCache";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

interface ContentResults {
    results: any[];
    total_pages: number;
    page: number;
    total_results: number;
}

export default function WatchlistPage() {
    const searchParams = useSearchParams();
    const search = searchParams.toString();
    const watchlistKey = getWatchlistKey(search);
    const cachedEntry = getWatchlistEntry(watchlistKey);

    const [upcomingMovies, setUpcomingMovies] = useState<ContentResults | null>(
        (cachedEntry?.upcomingMovies as ContentResults | null) ?? null
    );
    const [isLoading, setIsLoading] = useState(!cachedEntry?.upcomingMovies);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [isWatchListLoading, setIsWatchListLoading] = useState(true);
    const loadMoreRef = useRef<HTMLDivElement>(null);
    const pageRef = useRef<HTMLDivElement>(null);
    const restoredScrollForKey = useRef<string | null>(null);
    const previousWatchlistKey = useRef<string | null>(null);

    const persistUpcoming = useCallback(
        (data: ContentResults | null) => {
            updateWatchlistEntry(watchlistKey, { upcomingMovies: data });
        },
        [watchlistKey]
    );

    const fetchUpcomingMovies = useCallback(
        async (page: number, isLoadingMore = false) => {
            if (!isLoadingMore) {
                const entry = getWatchlistEntry(watchlistKey);
                if (!entry?.upcomingMovies) {
                    setIsLoading(true);
                }
            }
            try {
                const movieData = await getUpcomingMovies(page);

                if (isLoadingMore) {
                    setUpcomingMovies((prev: ContentResults | null) => {
                        const next = prev
                            ? {
                                  ...movieData,
                                  results: [...prev.results, ...movieData.results],
                              }
                            : movieData;
                        persistUpcoming(next);
                        return next;
                    });
                } else {
                    setUpcomingMovies(movieData);
                    persistUpcoming(movieData);
                }
            } catch (error) {
                console.error("Error fetching upcoming movies:", error);
            } finally {
                setIsLoading(false);
                setIsFetchingMore(false);
            }
        },
        [persistUpcoming, watchlistKey]
    );

    useEffect(() => {
        const entry = getWatchlistEntry(watchlistKey);
        if (entry?.upcomingMovies) {
            setUpcomingMovies(entry.upcomingMovies as ContentResults);
            setIsLoading(false);
            return;
        }
        fetchUpcomingMovies(1);
    }, [fetchUpcomingMovies, watchlistKey]);

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

    useEffect(() => {
        let ticking = false;
        const onScroll = () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                saveWatchlistScroll(watchlistKey);
                ticking = false;
            });
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, [watchlistKey]);

    useEffect(() => {
        const container = pageRef.current;
        if (!container) return;

        const onClickCapture = () => saveWatchlistScroll(watchlistKey);
        container.addEventListener("click", onClickCapture, { capture: true });
        return () => container.removeEventListener("click", onClickCapture, { capture: true });
    }, [watchlistKey]);

    useLayoutEffect(() => {
        if (previousWatchlistKey.current === null) {
            previousWatchlistKey.current = watchlistKey;
        } else if (previousWatchlistKey.current !== watchlistKey) {
            previousWatchlistKey.current = watchlistKey;
            restoredScrollForKey.current = watchlistKey;
            return;
        }

        const isPageReady = !isLoading && !isWatchListLoading;
        if (restoredScrollForKey.current === watchlistKey || !isPageReady) return;

        const scrollY = getWatchlistEntry(watchlistKey)?.scrollY ?? 0;
        restoredScrollForKey.current = watchlistKey;
        if (scrollY <= 0) return;

        const apply = () => {
            const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
            window.scrollTo(0, Math.min(scrollY, maxScroll));
        };

        apply();
        requestAnimationFrame(apply);
    }, [watchlistKey, isLoading, isWatchListLoading]);

    return (
        <div ref={pageRef} className="container mx-auto px-5 pb-12 lg:px-10">
            <WatchList onLoadingChange={setIsWatchListLoading} />

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
