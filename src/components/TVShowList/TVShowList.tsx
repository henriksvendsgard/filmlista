"use client";

import { Button } from "@/components/ui/button";
import { addToList, getLists, getListsForMediaBatch, List, removeFromList } from "@/lib/listRepository";
import { TMDBTVShow } from "@/types/tvshow";
import { useSupabase } from "@/components/SupabaseProvider";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { TVShowCard } from "../TVShowCard/TVShowCard";
import { TVShowGridSkeleton } from "../TVShowList/TVShowCardSkeleton";

interface TVShowListProps {
    tvshows: {
        results: TMDBTVShow[];
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

type TVShowListAction = {
    type: "added" | "removed";
    listId: string;
    tvshowId: string;
};

export default function TVShowList({
    tvshows,
    title,
    isOnFrontPage,
    isLoading,
    onPageChange,
    currentPage,
}: TVShowListProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [lists, setLists] = useState<{ owned: List[]; shared: List[] }>({ owned: [], shared: [] });
    const [tvshowListMap, setTVShowListMap] = useState<{ [key: string]: string[] }>({});
    const [isLoadingListMap, setIsLoadingListMap] = useState(true);

    const { supabase } = useSupabase();

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

    const fetchTVShowListMap = useCallback(async () => {
        if (!tvshows.results.length) return;

        try {
            const tvshowMap = await getListsForMediaBatch(
                supabase,
                tvshows.results.map((m) => m.id.toString()),
                "tv"
            );
            setTVShowListMap(tvshowMap);
        } catch (error) {
            console.error("Error fetching TV show list map:", error);
        }
    }, [supabase, tvshows.results]);

    const handleAddToList = async (tvshow: TMDBTVShow, listId: string) => {
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) return;

            await addToList(supabase, {
                mediaId: tvshow.id.toString(),
                listId,
                mediaType: "tv",
                title: tvshow.name,
                posterPath: tvshow.poster_path,
                addedBy: user.id,
                releaseDate: tvshow.first_air_date,
            });

            setTVShowListMap((prev) => ({
                ...prev,
                [tvshow.id.toString()]: [...(prev[tvshow.id.toString()] || []), listId],
            }));

            const event = new CustomEvent("tvshowListUpdate", {
                detail: {
                    type: "added",
                    listId,
                    tvshowId: tvshow.id.toString(),
                } as TVShowListAction,
            });
            window.dispatchEvent(event);

            toast({
                title: "TV-serie lagt til",
                description: `"${tvshow.name}" er nå lagt til i "${lists.owned.find((list) => list.id === listId)?.name}"`,
                className: "bg-blue-800",
            });
        } catch (error) {
            console.error("Error adding TV show to list:", error);
            toast({
                title: "Feil",
                description: "Kunne ikke legge til TV-serien i listen",
                variant: "destructive",
            });
        }
    };

    const handleRemoveFromList = async (tvshow: TMDBTVShow, listId: string) => {
        try {
            await removeFromList(supabase, {
                mediaId: tvshow.id.toString(),
                listId,
                mediaType: "tv",
            });

            setTVShowListMap((prev) => {
                const newMap = { ...prev };
                const tvshowId = tvshow.id.toString();
                if (newMap[tvshowId]) {
                    newMap[tvshowId] = newMap[tvshowId].filter((id) => id !== listId);
                    if (newMap[tvshowId].length === 0) {
                        delete newMap[tvshowId];
                    }
                }
                return newMap;
            });

            const event = new CustomEvent("tvshowListUpdate", {
                detail: {
                    type: "removed",
                    listId,
                    tvshowId: tvshow.id.toString(),
                } as TVShowListAction,
            });
            window.dispatchEvent(event);

            toast({
                title: "TV-serie fjernet",
                description: `"${tvshow.name}" er nå fjernet fra "${lists.owned.find((list) => list.id === listId)?.name}"`,
                className: "bg-orange-800",
            });
        } catch (error) {
            console.error("Error removing TV show from list:", error);
            toast({
                title: "Feil",
                description: "Kunne ikke fjerne TV-serien fra listen",
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

    // Initial data fetch
    useEffect(() => {
        fetchLists();
    }, [fetchLists]);

    // Update list mapping when TV shows change
    useEffect(() => {
        if (!isLoading) {
            setIsLoadingListMap(true);
            fetchTVShowListMap().finally(() => {
                setIsLoadingListMap(false);
            });
        }
    }, [fetchTVShowListMap, tvshows.results, isLoading]);

    useEffect(() => {
        const handleTVShowListUpdate = (event: CustomEvent<TVShowListAction>) => {
            const { type, tvshowId, listId } = event.detail;
            setTVShowListMap((prev) => {
                const newMap = { ...prev };
                if (type === "removed") {
                    if (newMap[tvshowId]) {
                        newMap[tvshowId] = newMap[tvshowId].filter((id) => id !== listId);
                        if (newMap[tvshowId].length === 0) {
                            delete newMap[tvshowId];
                        }
                    }
                } else if (type === "added") {
                    if (!newMap[tvshowId]) {
                        newMap[tvshowId] = [];
                    }
                    newMap[tvshowId] = [...newMap[tvshowId], listId];
                }
                return newMap;
            });
        };

        window.addEventListener("tvshowListUpdate", handleTVShowListUpdate as EventListener);
        return () => {
            window.removeEventListener("tvshowListUpdate", handleTVShowListUpdate as EventListener);
        };
    }, []);

    return (
        <section className="tv-show-list h-full w-full max-w-full">
            <h2 className="mb-6 text-3xl font-bold tracking-tight">{title}</h2>

            <div className="w-full max-w-full">
                {isLoading && tvshows.results.length === 0 ? (
                    <TVShowGridSkeleton />
                ) : (
                    <>
                        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                            {tvshows.results.map((tvshow) => (
                                <TVShowCard
                                    key={tvshow.id}
                                    tvshow={tvshow}
                                    lists={lists}
                                    onAddToList={handleAddToList}
                                    onRemoveFromList={handleRemoveFromList}
                                    isInLists={tvshowListMap[tvshow.id.toString()] || []}
                                    hasOthersWatched={false}
                                    othersWhoWatched={[]}
                                    showAddedBy={undefined}
                                    isLoadingListMap={isLoadingListMap}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>

            {isOnFrontPage && tvshows.total_pages > 1 && !isLoading && (
                <div className="mb-12 mt-8 flex items-center justify-center gap-6">
                    <Button
                        variant="outline"
                        onClick={() => paginate((currentPage || tvshows.page) - 1)}
                        disabled={(currentPage || tvshows.page) === 1}
                        className="h-10"
                    >
                        <ChevronLeft className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Forrige</span>
                    </Button>

                    <div className="flex items-center">
                        <span className="text-sm">Side {currentPage || tvshows.page}</span>
                    </div>

                    <Button
                        variant="outline"
                        onClick={() => paginate((currentPage || tvshows.page) + 1)}
                        disabled={(currentPage || tvshows.page) === Math.min(tvshows.total_pages, 500)}
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
