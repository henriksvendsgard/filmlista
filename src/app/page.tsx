"use client";

import MovieList from "@/components/MovieList/MovieList";
import TVShowList from "@/components/TVShowList/TVShowList";
import { GenreSelector } from "@/components/GenreSelector/GenreSelector";
import { MediaTypeSelector } from "@/components/MediaTypeSelector/MediaTypeSelector";
import { StreamingFilterSection } from "@/components/StreamingServicesSelector/StreamingFilterSection";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { getDiscoverMovies, getMovieGenres, getPopularMovies } from "@/lib/getMovies";
import { getDiscoverTVShows, getPopularTVShows, getTVShowGenres } from "@/lib/getTVShows";
import {
    getExploreEntry,
    getExploreGenreCache,
    getExploreKey,
    saveExploreScroll,
    setExploreGenreCache,
    updateExploreEntry,
} from "@/lib/exploreCache";
import { dedupeById } from "@/lib/dedupeById";
import { useStreamingServices } from "@/hooks/useStreamingServices";
import { LandingFeatures } from "@/components/Landing/LandingFeatures";
import { LandingHero } from "@/components/Landing/LandingHero";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

interface ContentResults {
    results: any[];
    total_pages: number;
    page: number;
    total_results: number;
}

export default function Home() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const loadMoreRef = useRef<HTMLDivElement>(null);
    const isFetchingMoreRef = useRef(false);
    const pageRef = useRef<HTMLDivElement>(null);
    const restoredScrollForKey = useRef<string | null>(null);
    const previousExploreKey = useRef<string | null>(null);
    const { services, hasServices, isLoading: isLoadingServices } = useStreamingServices();

    const search = searchParams.toString();
    const exploreKey = getExploreKey(search);
    const cachedEntry = getExploreEntry(exploreKey);

    const currentParams = useMemo(() => {
        const selectedGenres = searchParams.get("genres")?.split(",").filter(Boolean) || [];
        const mediaType = searchParams.get("type") || "movie";
        const streamingFilter = searchParams.get("streaming") === "1";
        return { selectedGenres, mediaType, streamingFilter };
    }, [searchParams]);

    const hasCachedContent =
        currentParams.mediaType === "movie"
            ? !!cachedEntry?.movies?.results?.length
            : !!cachedEntry?.tvshows?.results?.length;

    const [movies, setMovies] = useState<ContentResults | null>(cachedEntry?.movies ?? null);
    const [tvshows, setTVShows] = useState<ContentResults | null>(cachedEntry?.tvshows ?? null);
    const genreCache = getExploreGenreCache();
    const [movieGenres, setMovieGenres] = useState<any[]>(genreCache.movieGenres);
    const [tvshowGenres, setTVShowGenres] = useState<any[]>(genreCache.tvshowGenres);
    const [isLoading, setIsLoading] = useState(!hasCachedContent);
    const [isFetchingMore, setIsFetchingMore] = useState(false);

    const updateUrl = useCallback(
        (newGenres: string[], mediaType?: string, streamingFilter?: boolean) => {
            const params = new URLSearchParams();
            if (newGenres.length > 0) {
                params.set("genres", newGenres.join(","));
            }
            params.set("type", mediaType || currentParams.mediaType);
            const streaming = streamingFilter ?? currentParams.streamingFilter;
            if (streaming) {
                params.set("streaming", "1");
            }
            router.push(`/?${params.toString()}`, { scroll: false });
        },
        [router, currentParams.mediaType, currentParams.streamingFilter]
    );

    const persistContent = useCallback(
        (data: { movies?: ContentResults | null; tvshows?: ContentResults | null }) => {
            updateExploreEntry(exploreKey, data);
        },
        [exploreKey]
    );

    const fetchContent = useCallback(
        async (page: number, isLoadingMore = false) => {
            if (!isLoadingMore) {
                const entry = getExploreEntry(exploreKey);
                const hasData =
                    currentParams.mediaType === "movie"
                        ? !!entry?.movies?.results?.length
                        : !!entry?.tvshows?.results?.length;
                if (!hasData) {
                    setIsLoading(true);
                }
            }

            try {
                const useStreamingFilter = currentParams.streamingFilter && hasServices;
                const watchProviders = useStreamingFilter ? services : undefined;

                if (currentParams.mediaType === "movie") {
                    const movieData =
                        currentParams.selectedGenres.length === 0 && !useStreamingFilter
                            ? await getPopularMovies(page)
                            : await getDiscoverMovies(
                                  currentParams.selectedGenres.join(","),
                                  undefined,
                                  page,
                                  watchProviders
                              );

                    if (isLoadingMore) {
                        setMovies((prev) => {
                            const next = prev
                                ? {
                                      ...prev,
                                      results: dedupeById([...prev.results, ...movieData.results]),
                                      page: movieData.page,
                                  }
                                : { ...movieData, results: dedupeById(movieData.results) };
                            persistContent({ movies: next });
                            return next;
                        });
                    } else {
                        const deduped = { ...movieData, results: dedupeById(movieData.results) };
                        setMovies(deduped);
                        persistContent({ movies: deduped });
                    }
                } else {
                    const tvshowData =
                        currentParams.selectedGenres.length === 0 && !useStreamingFilter
                            ? await getPopularTVShows(page)
                            : await getDiscoverTVShows(
                                  currentParams.selectedGenres.join(","),
                                  page,
                                  watchProviders
                              );

                    if (isLoadingMore) {
                        setTVShows((prev) => {
                            const next = prev
                                ? {
                                      ...prev,
                                      results: dedupeById([...prev.results, ...tvshowData.results]),
                                      page: tvshowData.page,
                                  }
                                : { ...tvshowData, results: dedupeById(tvshowData.results) };
                            persistContent({ tvshows: next });
                            return next;
                        });
                    } else {
                        const deduped = { ...tvshowData, results: dedupeById(tvshowData.results) };
                        setTVShows(deduped);
                        persistContent({ tvshows: deduped });
                    }
                }
            } catch (error) {
                console.error("Error fetching content:", error);
            } finally {
                setIsLoading(false);
                setIsFetchingMore(false);
                isFetchingMoreRef.current = false;
            }
        },
        [
            currentParams.mediaType,
            currentParams.selectedGenres,
            currentParams.streamingFilter,
            hasServices,
            services,
            exploreKey,
            persistContent,
        ]
    );

    const fetchGenres = useCallback(async () => {
        const cached = getExploreGenreCache();
        if (cached.movieGenres.length > 0) {
            setMovieGenres(cached.movieGenres);
            setTVShowGenres(cached.tvshowGenres);
            return;
        }
        try {
            const [movieGenreData, tvshowGenreData] = await Promise.all([getMovieGenres(), getTVShowGenres()]);
            setMovieGenres(movieGenreData);
            setTVShowGenres(tvshowGenreData);
            setExploreGenreCache(movieGenreData, tvshowGenreData);
        } catch (error) {
            console.error("Error fetching genres:", error);
        }
    }, []);

    useEffect(() => {
        fetchGenres();
    }, [fetchGenres]);

    useEffect(() => {
        if (isLoadingServices && currentParams.streamingFilter) return;

        const entry = getExploreEntry(exploreKey);
        if (entry) {
            setMovies(entry.movies);
            setTVShows(entry.tvshows);
            const hasData =
                currentParams.mediaType === "movie"
                    ? !!entry.movies?.results?.length
                    : !!entry.tvshows?.results?.length;
            if (hasData) {
                setIsLoading(false);
                return;
            }
        }

        fetchContent(1);
    }, [fetchContent, isLoadingServices, currentParams.streamingFilter, exploreKey, currentParams.mediaType]);

    const loadMore = useCallback(() => {
        if (isFetchingMoreRef.current) return;

        const currentResults = currentParams.mediaType === "movie" ? movies : tvshows;
        if (!currentResults || currentResults.page >= currentResults.total_pages) return;

        isFetchingMoreRef.current = true;
        setIsFetchingMore(true);
        fetchContent(currentResults.page + 1, true);
    }, [currentParams.mediaType, movies, tvshows, fetchContent]);

    useEffect(() => {
        const target = loadMoreRef.current;
        if (!target) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) {
                    loadMore();
                }
            },
            { threshold: 0, rootMargin: "400px" }
        );

        observer.observe(target);
        return () => observer.disconnect();
    }, [loadMore]);

    useEffect(() => {
        let ticking = false;
        const onScroll = () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                saveExploreScroll(exploreKey);
                ticking = false;
            });
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, [exploreKey]);

    useEffect(() => {
        const container = pageRef.current;
        if (!container) return;

        const onClickCapture = () => saveExploreScroll(exploreKey);
        container.addEventListener("click", onClickCapture, { capture: true });
        return () => container.removeEventListener("click", onClickCapture, { capture: true });
    }, [exploreKey]);

    useLayoutEffect(() => {
        if (previousExploreKey.current === null) {
            previousExploreKey.current = exploreKey;
        } else if (previousExploreKey.current !== exploreKey) {
            previousExploreKey.current = exploreKey;
            restoredScrollForKey.current = exploreKey;
            return;
        }

        if (restoredScrollForKey.current === exploreKey || isLoading) return;

        const scrollY = getExploreEntry(exploreKey)?.scrollY ?? 0;
        restoredScrollForKey.current = exploreKey;
        if (scrollY <= 0) return;

        const apply = () => {
            const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
            window.scrollTo(0, Math.min(scrollY, maxScroll));
        };

        apply();
        requestAnimationFrame(apply);
    }, [exploreKey, isLoading]);

    const handleGenreToggle = useCallback(
        (genreId: string) => {
            const newGenres = currentParams.selectedGenres.includes(genreId)
                ? currentParams.selectedGenres.filter((id) => id !== genreId)
                : [...currentParams.selectedGenres, genreId];
            updateUrl(newGenres);
        },
        [currentParams.selectedGenres, updateUrl]
    );

    const handleClearGenres = useCallback(() => {
        updateUrl([]);
    }, [updateUrl]);

    const handleMediaTypeChange = useCallback(
        (type: string) => {
            updateUrl([], type);
        },
        [updateUrl]
    );

    const handleStreamingFilterChange = useCallback(
        (checked: boolean) => {
            updateUrl(currentParams.selectedGenres, currentParams.mediaType, checked);
        },
        [currentParams.selectedGenres, currentParams.mediaType, updateUrl]
    );

    const translateGenre = (genre: string): string => {
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
    };

    const currentGenres = currentParams.mediaType === "movie" ? movieGenres : tvshowGenres;

    return (
        <div className="w-full">
            <LandingHero />
            <LandingFeatures />

            <div ref={pageRef} id="utforsk" className="mb-20 mt-16 w-full scroll-mt-44 px-5 lg:px-10">
                <div className="mb-8 flex flex-col gap-6">
                    <div className="space-y-2">
                        <p className="text-sm font-medium uppercase tracking-[0.2em] text-filmlista-primary">
                            Katalog
                        </p>
                        <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Utforsk</h2>
                        <p className="max-w-2xl text-muted-foreground">
                            Bla i populære titler, filtrer på sjangere og se hva som faktisk er tilgjengelig hos deg.
                        </p>
                    </div>

                <Tabs value={currentParams.mediaType} onValueChange={handleMediaTypeChange} className="w-full">
                    <div className="mb-6 flex w-full flex-col items-start gap-4 md:flex-row md:items-end md:justify-between">
                        <MediaTypeSelector
                            value={currentParams.mediaType as "movie" | "tv"}
                            onChange={handleMediaTypeChange}
                        />

                        {!isLoadingServices && (
                            <div className="w-full max-w-md space-y-1.5 sm:w-auto">
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Tilgjengelighet
                                </p>
                                <StreamingFilterSection
                                    filterActive={currentParams.streamingFilter}
                                    onFilterChange={handleStreamingFilterChange}
                                />
                            </div>
                        )}
                    </div>

                    <GenreSelector
                        className="mb-6"
                        genres={currentGenres}
                        selectedIds={currentParams.selectedGenres}
                        onToggle={handleGenreToggle}
                        onClear={handleClearGenres}
                        translateGenre={translateGenre}
                    />

                    <TabsContent value="movie">
                        <MovieList
                            title={
                                currentParams.streamingFilter && hasServices
                                    ? "Filmer på dine tjenester"
                                    : currentParams.selectedGenres.length === 0
                                      ? "Populære filmer"
                                      : "Filmer i valgte sjangere"
                            }
                            movies={movies || { results: [], total_pages: 0, page: 1, total_results: 0 }}
                            isOnFrontPage={false}
                            isLoading={isLoading}
                        />
                    </TabsContent>

                    <TabsContent value="tv">
                        <TVShowList
                            title={
                                currentParams.streamingFilter && hasServices
                                    ? "TV-serier på dine tjenester"
                                    : currentParams.selectedGenres.length === 0
                                      ? "Populære TV-serier"
                                      : "TV-serier i valgte sjangere"
                            }
                            tvshows={tvshows || { results: [], total_pages: 0, page: 1, total_results: 0 }}
                            isOnFrontPage={false}
                            isLoading={isLoading}
                        />
                    </TabsContent>
                </Tabs>

                <div ref={loadMoreRef} className="h-10 w-full">
                    {isFetchingMore && (
                        <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-10 w-10 animate-spin text-filmlista-primary" />
                        </div>
                    )}
                </div>
            </div>
        </div>
        </div>
    );
}
