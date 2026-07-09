"use client";

import MovieList from "@/components/MovieList/MovieList";
import TVShowList from "@/components/TVShowList/TVShowList";
import { StreamingFilterSection } from "@/components/StreamingServicesSelector/StreamingFilterSection";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStreamingServices } from "@/hooks/useStreamingServices";
import { getSearchedMovies } from "@/lib/getMovies";
import { getSearchedTVShows } from "@/lib/getTVShows";
import {
    fetchWatchProvidersBatch,
    matchesUserServices,
    type WatchProvidersNO,
} from "@/lib/watchProviders";
import { Film, Loader2, SearchX } from "lucide-react";
import Link from "next/link";
import { notFound, useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface SearchResults {
    results: any[];
    total_pages: number;
    page: number;
    total_results: number;
}

const EMPTY_RESULTS: SearchResults = {
    results: [],
    total_pages: 0,
    page: 1,
    total_results: 0,
};

function buildSearchUrl(term: string, type: string, streamingFilter: boolean) {
    const params = new URLSearchParams();
    params.set("type", type);
    if (streamingFilter) {
        params.set("streaming", "1");
    }
    return `/search/${encodeURIComponent(term)}?${params.toString()}`;
}

function providerKey(mediaType: "movie" | "tv", mediaId: string | number) {
    return `${mediaType}:${mediaId}`;
}

export default function SearchPage() {
    const [movies, setMovies] = useState<SearchResults | null>(null);
    const [tvshows, setTVShows] = useState<SearchResults | null>(null);
    const [movieTotalResults, setMovieTotalResults] = useState(0);
    const [tvTotalResults, setTvTotalResults] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [providerMap, setProviderMap] = useState<Map<string, WatchProvidersNO | null>>(new Map());
    const [inFlightProviderKeys, setInFlightProviderKeys] = useState<string[]>([]);

    const routeParams = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const mediaType = (searchParams.get("type") || "movie") as "movie" | "tv";
    const streamingFilter = searchParams.get("streaming") === "1";
    const term = typeof routeParams.term === "string" ? routeParams.term : routeParams.term?.[0];
    const decodedTerm = term ? decodeURIComponent(term) : "";
    const loadMoreRef = useRef<HTMLDivElement>(null);
    const providerRequestIdRef = useRef(0);
    const inFlightProviderKeySet = useMemo(() => new Set(inFlightProviderKeys), [inFlightProviderKeys]);

    const { services, hasServices, isLoading: isLoadingServices } = useStreamingServices();
    const useStreamingFilter = streamingFilter && hasServices && !isLoadingServices;

    const activeResults = mediaType === "movie" ? movies : tvshows;
    const activeTotal = mediaType === "movie" ? movieTotalResults : tvTotalResults;
    const activeItems = activeResults?.results ?? [];

    const missingProviderItems = useMemo(() => {
        if (!useStreamingFilter || activeItems.length === 0) return [];

        return activeItems
            .filter((item) => {
                const key = providerKey(mediaType, item.id);
                return !providerMap.has(key) && !inFlightProviderKeySet.has(key);
            })
            .map((item) => ({
                mediaId: String(item.id),
                mediaType,
            }));
    }, [useStreamingFilter, activeItems, providerMap, mediaType, inFlightProviderKeySet]);

    const missingProviderKey = useMemo(
        () => missingProviderItems.map((item) => providerKey(item.mediaType, item.mediaId)).join(","),
        [missingProviderItems]
    );

    const allProvidersResolved =
        !useStreamingFilter ||
        activeItems.length === 0 ||
        activeItems.every((item) => providerMap.has(providerKey(mediaType, item.id)));

    const filterResults = useCallback(
        (results: any[], type: "movie" | "tv") => {
            if (!useStreamingFilter) return results;

            return results.filter((item) => {
                const providers = providerMap.get(providerKey(type, item.id));
                if (providers === undefined) return false;
                return matchesUserServices(providers, services);
            });
        },
        [providerMap, services, useStreamingFilter]
    );

    const filteredMovies = useMemo(
        () => filterResults(movies?.results ?? [], "movie"),
        [filterResults, movies?.results]
    );
    const filteredTvShows = useMemo(
        () => filterResults(tvshows?.results ?? [], "tv"),
        [filterResults, tvshows?.results]
    );
    const activeFilteredResults = mediaType === "movie" ? filteredMovies : filteredTvShows;

    const isResolvingProviders = useStreamingFilter && !allProvidersResolved;

    const hasReachedEnd =
        !!activeResults &&
        !isLoading &&
        !isFetchingMore &&
        activeResults.results.length > 0 &&
        activeResults.page >= Math.min(activeResults.total_pages, 500);

    const loadInitialResults = useCallback(async () => {
        if (!decodedTerm) return notFound();

        setIsLoading(true);
        setError(null);
        providerRequestIdRef.current += 1;
        setProviderMap(new Map());
        setInFlightProviderKeys([]);

        try {
            const [movieResults, tvResults] = await Promise.all([
                getSearchedMovies(decodedTerm, 1),
                getSearchedTVShows(decodedTerm, 1),
            ]);

            setMovies(movieResults);
            setTVShows(tvResults);
            setMovieTotalResults(movieResults.total_results);
            setTvTotalResults(tvResults.total_results);
        } catch (fetchError) {
            console.error("Error fetching search results:", fetchError);
            setMovies(null);
            setTVShows(null);
            setError("Kunne ikke hente søkeresultater. Sjekk nettverket og prøv igjen.");
        } finally {
            setIsLoading(false);
        }
    }, [decodedTerm]);

    const fetchMoreResults = useCallback(async () => {
        if (!decodedTerm || !activeResults) return;

        const nextPage = activeResults.page + 1;
        if (nextPage > Math.min(activeResults.total_pages, 500)) return;

        setIsFetchingMore(true);

        try {
            if (mediaType === "movie") {
                const movieResults = await getSearchedMovies(decodedTerm, nextPage);
                setMovies((prev) =>
                    prev
                        ? {
                              ...prev,
                              results: [...prev.results, ...movieResults.results],
                              page: movieResults.page,
                          }
                        : movieResults
                );
            } else {
                const tvResults = await getSearchedTVShows(decodedTerm, nextPage);
                setTVShows((prev) =>
                    prev
                        ? {
                              ...prev,
                              results: [...prev.results, ...tvResults.results],
                              page: tvResults.page,
                          }
                        : tvResults
                );
            }
        } catch (fetchError) {
            console.error("Error fetching more search results:", fetchError);
            setError("Kunne ikke laste flere resultater.");
        } finally {
            setIsFetchingMore(false);
        }
    }, [activeResults, decodedTerm, mediaType]);

    useEffect(() => {
        loadInitialResults();
    }, [loadInitialResults]);

    useEffect(() => {
        if (!useStreamingFilter) return;

        const toFetch = missingProviderItems.filter((item) => {
            const key = providerKey(item.mediaType, item.mediaId);
            return !inFlightProviderKeySet.has(key);
        });

        if (toFetch.length === 0) return;

        const requestId = ++providerRequestIdRef.current;
        const keys = toFetch.map((item) => providerKey(item.mediaType, item.mediaId));
        setInFlightProviderKeys((prev) => [...new Set([...prev, ...keys])]);

        const fetchProviders = async () => {
            try {
                const fetched = await fetchWatchProvidersBatch(toFetch);
                if (requestId !== providerRequestIdRef.current) return;

                setProviderMap((prev) => {
                    const next = new Map(prev);
                    fetched.forEach((value, key) => next.set(key, value));
                    return next;
                });
            } catch (fetchError) {
                console.error("Error fetching watch providers:", fetchError);
            } finally {
                setInFlightProviderKeys((prev) => prev.filter((key) => !keys.includes(key)));
            }
        };

        void fetchProviders();
    }, [useStreamingFilter, missingProviderKey, missingProviderItems, inFlightProviderKeySet]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const first = entries[0];
                if (first.isIntersecting && !isFetchingMore && !isLoading && !isResolvingProviders) {
                    const current = mediaType === "movie" ? movies : tvshows;
                    if (current && current.page < Math.min(current.total_pages, 500)) {
                        fetchMoreResults();
                    }
                }
            },
            { threshold: 0.1 }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [fetchMoreResults, isFetchingMore, isLoading, isResolvingProviders, mediaType, movies, tvshows]);

    const handleTabChange = (value: string) => {
        router.push(buildSearchUrl(decodedTerm, value, streamingFilter));
    };

    const handleStreamingFilterChange = (active: boolean) => {
        router.push(buildSearchUrl(decodedTerm, mediaType, active));
    };

    const showNoSearchResults =
        !isLoading && !error && activeResults !== null && activeItems.length === 0;

    const showNoStreamingMatches =
        !isLoading &&
        !error &&
        useStreamingFilter &&
        allProvidersResolved &&
        activeItems.length > 0 &&
        activeFilteredResults.length === 0;

    const resultSummary = (() => {
        if (isLoading) return "Søker...";
        if (error) return null;
        if (isResolvingProviders && activeFilteredResults.length === 0) {
            return "Sjekker tilgjengelighet på dine tjenester...";
        }

        const label = mediaType === "movie" ? "filmer" : "TV-serier";
        if (useStreamingFilter) {
            const loadedCount = activeItems.length;
            return `${activeFilteredResults.length} ${label} på dine tjenester${loadedCount < activeTotal ? ` (av ${loadedCount} lastede treff)` : ""}`;
        }

        return `${activeTotal} ${label}`;
    })();

    const displayMovies: SearchResults = {
        ...(movies ?? EMPTY_RESULTS),
        results: filteredMovies,
    };
    const displayTvShows: SearchResults = {
        ...(tvshows ?? EMPTY_RESULTS),
        results: filteredTvShows,
    };

    const showResultsGrid =
        !showNoSearchResults && !showNoStreamingMatches;

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold">Søkeresultater for &quot;{decodedTerm}&quot;</h1>
            <p className="mt-2 text-muted-foreground" aria-live="polite">
                {resultSummary}
            </p>

            {error && !isLoading && (
                <div className="mt-8 flex flex-col items-center rounded-lg border border-dashed py-16 text-center">
                    <SearchX className="mb-4 h-12 w-12 text-muted-foreground/60" />
                    <h2 className="text-lg font-semibold">Noe gikk galt</h2>
                    <p className="mt-2 max-w-sm text-sm text-muted-foreground">{error}</p>
                    <Button className="mt-6" onClick={() => loadInitialResults()}>
                        Prøv igjen
                    </Button>
                </div>
            )}

            {!error && (
                <Tabs value={mediaType} onValueChange={handleTabChange} className="mt-8">
                    <div className="mb-6 flex w-full flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <TabsList className="w-fit shrink-0">
                            <TabsTrigger value="movie">Filmer ({movieTotalResults})</TabsTrigger>
                            <TabsTrigger value="tv">TV-serier ({tvTotalResults})</TabsTrigger>
                        </TabsList>

                        {!isLoadingServices && (
                            <div className="w-full max-w-md sm:w-auto">
                                <StreamingFilterSection
                                    filterActive={streamingFilter}
                                    onFilterChange={handleStreamingFilterChange}
                                    loadingProviders={isResolvingProviders}
                                />
                            </div>
                        )}
                    </div>

                    {showNoSearchResults && (
                        <div className="flex flex-col items-center rounded-lg border border-dashed py-16 text-center">
                            <Film className="mb-4 h-12 w-12 text-muted-foreground/50" />
                            <h2 className="text-lg font-semibold">
                                Ingen {mediaType === "movie" ? "filmer" : "TV-serier"}
                            </h2>
                            <p className="mt-2 max-w-md text-sm text-muted-foreground">
                                Fant ingen treff for «{decodedTerm}». Prøv et annet søkeord, sjekk
                                stavingen, eller søk på originaltittel.
                            </p>
                            <Button asChild variant="outline" className="mt-6">
                                <Link href="/">Utforsk populære titler</Link>
                            </Button>
                        </div>
                    )}

                    {showNoStreamingMatches && (
                        <div className="flex flex-col items-center rounded-lg border border-dashed py-16 text-center">
                            <Film className="mb-4 h-12 w-12 text-muted-foreground/50" />
                            <h2 className="text-lg font-semibold">Ingen treff på dine tjenester</h2>
                            <p className="mt-2 max-w-md text-sm text-muted-foreground">
                                Ingen av de lastede resultatene for «{decodedTerm}» er tilgjengelige på
                                tjenestene dine. Prøv å skru av filteret eller last flere resultater.
                            </p>
                            <Button
                                variant="outline"
                                className="mt-6"
                                onClick={() => handleStreamingFilterChange(false)}
                            >
                                Vis alle treff
                            </Button>
                        </div>
                    )}

                    {showResultsGrid && (
                        <>
                            <TabsContent value="movie">
                                <MovieList
                                    movies={displayMovies}
                                    title={useStreamingFilter ? "Filmer på dine tjenester" : "Filmer"}
                                    isLoading={isLoading && mediaType === "movie"}
                                    isOnFrontPage={false}
                                    hideTitle
                                />
                            </TabsContent>

                            <TabsContent value="tv">
                                <TVShowList
                                    tvshows={displayTvShows}
                                    title={useStreamingFilter ? "TV-serier på dine tjenester" : "TV-serier"}
                                    isLoading={isLoading && mediaType === "tv"}
                                    isOnFrontPage={false}
                                    hideTitle
                                />
                            </TabsContent>

                            {isResolvingProviders && (
                                <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin text-filmlista-primary" />
                                    Sjekker flere titler på dine tjenester...
                                </div>
                            )}
                        </>
                    )}

                    <div ref={loadMoreRef} className="h-10 w-full">
                        {isFetchingMore && (
                            <div className="flex items-center justify-center py-4">
                                <Loader2 className="h-8 w-8 animate-spin text-filmlista-primary" />
                            </div>
                        )}
                        {hasReachedEnd && showResultsGrid && (
                            <p className="py-6 text-center text-sm text-muted-foreground">
                                Du har nådd slutten av resultatene
                            </p>
                        )}
                    </div>
                </Tabs>
            )}
        </div>
    );
}
