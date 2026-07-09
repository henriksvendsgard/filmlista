"use client";

import { Button } from "@/components/ui/button";
import { useListActions } from "@/contexts/ListActionsContext";
import { TMDBTVShow } from "@/types/tvshow";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
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
    hideTitle?: boolean;
    onPageChange?: (page: number) => void;
    currentPage?: number;
}

export default function TVShowList({
    tvshows,
    title,
    isOnFrontPage,
    isLoading,
    hideTitle,
    onPageChange,
    currentPage,
}: TVShowListProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { lists, getMediaListIds, ensureMediaMembership } = useListActions();

    useEffect(() => {
        if (!isLoading && tvshows.results.length > 0) {
            ensureMediaMembership(
                tvshows.results.map((show) => show.id.toString()),
                "tv"
            );
        }
    }, [ensureMediaMembership, isLoading, tvshows.results]);

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
        <section className="tv-show-list h-full w-full max-w-full">
            {!hideTitle && <h2 className="mb-6 text-3xl font-bold tracking-tight">{title}</h2>}

            <div className="w-full max-w-full">
                {isLoading && tvshows.results.length === 0 ? (
                    <TVShowGridSkeleton />
                ) : (
                    <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                        {tvshows.results.map((tvshow) => {
                            const mediaId = tvshow.id.toString();
                            const isInLists = getMediaListIds(mediaId, "tv");

                            return (
                                <TVShowCard
                                    key={tvshow.id}
                                    tvshow={tvshow}
                                    media={{
                                        mediaId,
                                        mediaType: "tv",
                                        title: tvshow.name,
                                        posterPath: tvshow.poster_path,
                                        releaseDate: tvshow.first_air_date,
                                    }}
                                    lists={lists}
                                    isInLists={isInLists}
                                    listCount={isInLists.length}
                                    hasOthersWatched={false}
                                    othersWhoWatched={[]}
                                />
                            );
                        })}
                    </div>
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
