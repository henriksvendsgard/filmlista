"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import {
    getMediaForList,
    MediaEntry,
    toggleWatched,
} from "@/lib/listRepository";
import { useListActions } from "@/contexts/ListActionsContext";
import { useCelebration } from "@/contexts/CelebrationContext";
import { Movie } from "@/types/movie";
import { ArrowRight, CheckCircle2, CircleDashed, Film, ListIcon, Settings2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { MovieCard } from "../MovieCard/MovieCard";
import { Skeleton } from "../ui/skeleton";
import { useSupabase } from "@/components/SupabaseProvider";
import Link from "next/link";
import { useStreamingServices } from "@/hooks/useStreamingServices";
import { StreamingFilterSection } from "@/components/StreamingServicesSelector/StreamingFilterSection";
import { fetchWatchProvidersBatch, matchesUserServices, WatchProvidersNO } from "@/lib/watchProviders";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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

function StatPill({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof Film;
    label: string;
    value: number;
}) {
    return (
        <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-card/80 px-3 py-2 shadow-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-filmlista-primary/10 text-filmlista-primary">
                <Icon className="h-4 w-4" />
            </div>
            <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="font-heading text-lg font-semibold leading-none">{value}</p>
            </div>
        </div>
    );
}

function WatchListEmptyState({
    title,
    description,
    action,
}: {
    title: string;
    description: string;
    action?: ReactNode;
}) {
    return (
        <div className="flex flex-col items-center rounded-2xl border border-dashed py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-filmlista-primary/10 text-filmlista-primary">
                <Film className="h-7 w-7 shrink-0" strokeWidth={1.75} />
            </div>
            <h3 className="font-heading text-lg font-semibold">{title}</h3>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
            {action && <div className="mt-6">{action}</div>}
        </div>
    );
}

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
            <WatchListEmptyState
                title="Ingen titler på dine tjenester"
                description="Prøv å fjerne filteret eller legg til flere tjenester i profilen din."
                action={
                    <Button asChild variant="outline">
                        <Link href="/profile">Gå til profil</Link>
                    </Button>
                }
            />
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
    const [isLoadingMovies, setIsLoadingMovies] = useState(false);
    const [movies, setMovies] = useState<ProcessedMovie[]>([]);
    const [selectedList, setSelectedList] = useState<string | null>(null);

    const { supabase, user } = useSupabase();
    const { lists, isLoadingLists, membershipVersion, removeFromList } = useListActions();
    const { celebrateWatched } = useCelebration();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const listIdFromUrl = searchParams.get("list");
    const { services, hasServices, isLoading: isLoadingServices } = useStreamingServices();
    const [streamingFilter, setStreamingFilter] = useState(false);
    const [isLoadingProviders, setIsLoadingProviders] = useState(false);
    const [providerMap, setProviderMap] = useState<Map<string, WatchProvidersNO | null>>(new Map());

    const updateUrlWithList = useCallback(
        (listId: string | null) => {
            const newUrl = listId ? `${pathname}?list=${listId}` : pathname;
            router.replace(newUrl);
        },
        [router, pathname]
    );

    const handleListSelection = useCallback(
        (listId: string) => {
            if (listId === "_header_owned" || listId === "_header_shared" || listId === "_no_lists") return;
            setSelectedList(listId);
            updateUrlWithList(listId);
        },
        [updateUrlWithList]
    );

    useEffect(() => {
        if (isLoadingLists || !user) return;

        const availableLists = [...lists.owned, ...lists.shared];
        const availableIds = new Set(availableLists.map((list) => list.id));

        if (listIdFromUrl && availableIds.has(listIdFromUrl)) {
            setSelectedList(listIdFromUrl);
            return;
        }

        const fallback = lists.owned[0]?.id ?? lists.shared[0]?.id;
        if (!fallback) return;

        setSelectedList(fallback);
        if (!listIdFromUrl || !availableIds.has(listIdFromUrl)) {
            updateUrlWithList(fallback);
        }
    }, [isLoadingLists, user, listIdFromUrl, lists.owned, lists.shared, updateUrlWithList]);

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
        await removeFromList(
            {
                mediaId: movieId,
                mediaType: mediaType as "movie" | "tv",
                title: movieTitle,
                posterPath: null,
            },
            listId,
            { alsoRemoveWatched: true }
        );
        fetchMovies();
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

            if (!currentWatchedStatus) {
                const title = movies.find((m) => m.movie_id === movieId)?.title ?? "Ukjent tittel";
                celebrateWatched({
                    title,
                    mediaType: mediaType as "movie" | "tv",
                });
            } else {
                toast({
                    title: "Markert som usett",
                    description: `${mediaType === "movie" ? "Filmen" : "TV-serien"} er nå markert som usett`,
                    className: "bg-yellow-600",
                });
            }
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
        if (selectedList) {
            fetchMovies();
        }
    }, [selectedList, fetchMovies, membershipVersion]);

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

    const isLoading = isLoadingLists || isLoadingMovies;

    const selectedListName = useMemo(() => {
        if (!selectedList) return null;
        return [...lists.owned, ...lists.shared].find((list) => list.id === selectedList)?.name ?? null;
    }, [lists.owned, lists.shared, selectedList]);

    const watchedCount = useMemo(() => movies.filter((movie) => movie.is_watched_by_me).length, [movies]);
    const unwatchedCount = movies.length - watchedCount;

    return (
        <div>
            <div className="mb-8 space-y-5">
                <div className="space-y-2">
                    <p className="text-sm font-medium uppercase tracking-[0.2em] text-filmlista-primary">
                        Dine filmer og serier
                    </p>
                    <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Filmlista</h1>
                    <p className="max-w-2xl text-muted-foreground">
                        Hold oversikt over hva dere vil se — og hva dere allerede har sett sammen.
                    </p>
                </div>

                {!isLoading && selectedList && movies.length > 0 && (
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                        <StatPill icon={ListIcon} label="I listen" value={movies.length} />
                        <StatPill icon={CircleDashed} label="Ikke sett" value={unwatchedCount} />
                        <StatPill icon={CheckCircle2} label="Sett" value={watchedCount} />
                    </div>
                )}
            </div>

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
                                            <Skeleton className="aspect-2/3 w-full" />
                                        </div>
                                    ))}
                                </div>
                            </TabsContent>
                        ))}
                    </Tabs>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div className="space-y-1.5">
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Aktiv liste
                            </p>
                            <Select value={selectedList || undefined} onValueChange={handleListSelection}>
                                <SelectTrigger className="h-11 w-full min-w-[220px] border-filmlista-primary/20 bg-card/80 sm:w-[260px]">
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

                        <Button asChild variant="outline" size="sm" className="shrink-0 gap-2">
                            <Link href="/lists">
                                <Settings2 className="h-4 w-4" />
                                Administrer lister
                            </Link>
                        </Button>
                    </div>

                    {!isLoadingServices && (
                        <StreamingFilterSection
                            filterActive={streamingFilter}
                            onFilterChange={setStreamingFilter}
                            showFilter={!!(selectedList && movies.length > 0)}
                            loadingProviders={isLoadingProviders}
                        />
                    )}

                    {!isLoading && (
                        <>
                            {lists.owned.length === 0 && lists.shared.length === 0 ? (
                                <WatchListEmptyState
                                    title="Du har ingen lister enda"
                                    description="Opprett en liste for å samle filmer og serier du vil se sammen med venner."
                                    action={
                                        <Button asChild className="rounded-full bg-filmlista-primary hover:bg-filmlista-hover">
                                            <Link href="/lists">
                                                Opprett en liste
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </Link>
                                        </Button>
                                    }
                                />
                            ) : selectedList && !isLoadingMovies && (!movies || movies.length === 0) ? (
                                <WatchListEmptyState
                                    title="Ingen titler i denne lista enda"
                                    description="Utforsk forsiden eller søk etter filmer og serier, og legg dem til i lista di."
                                    action={
                                        <Button asChild variant="outline">
                                            <Link href="/">Utforsk titler</Link>
                                        </Button>
                                    }
                                />
                            ) : null}
                        </>
                    )}

                    {selectedList && movies && movies.length > 0 && !isLoading && (
                        <Tabs defaultValue="all" className="w-full">
                            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <TabsList className="w-fit">
                                    <TabsTrigger value="all">Alle ({movies.length})</TabsTrigger>
                                    <TabsTrigger value="unwatched">Ikke sett ({unwatchedCount})</TabsTrigger>
                                    <TabsTrigger value="watched">Sett ({watchedCount})</TabsTrigger>
                                </TabsList>
                                {streamingFilter && hasServices && (
                                    <p className="text-sm text-muted-foreground">
                                        Viser titler på dine tjenester
                                    </p>
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
