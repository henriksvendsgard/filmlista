"use client";

import MovieList from "@/components/MovieList/MovieList";
import TVShowList from "@/components/TVShowList/TVShowList";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getDiscoverMovies, getMovieGenres, getPopularMovies } from "@/lib/getMovies";
import { getDiscoverTVShows, getPopularTVShows, getTVShowGenres } from "@/lib/getTVShows";
import { ChevronDown, Loader2, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface ContentResults {
    results: any[];
    total_pages: number;
    page: number;
    total_results: number;
}

export default function Home() {
    const [movies, setMovies] = useState<ContentResults | null>(null);
    const [tvshows, setTVShows] = useState<ContentResults | null>(null);
    const [movieGenres, setMovieGenres] = useState<any[]>([]);
    const [tvshowGenres, setTVShowGenres] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const searchParams = useSearchParams();
    const router = useRouter();
    const loadMoreRef = useRef<HTMLDivElement>(null);

    const currentParams = useMemo(() => {
        const selectedGenres = searchParams.get("genres")?.split(",").filter(Boolean) || [];
        const mediaType = searchParams.get("type") || "movie";
        return { selectedGenres, mediaType };
    }, [searchParams]);

    const updateUrl = useCallback(
        (newGenres: string[], mediaType?: string) => {
            const params = new URLSearchParams();
            if (newGenres.length > 0) {
                params.set("genres", newGenres.join(","));
            }
            params.set("type", mediaType || currentParams.mediaType);
            router.push(`/?${params.toString()}`);
        },
        [router, currentParams.mediaType]
    );

    const fetchContent = useCallback(
        async (page: number, isLoadingMore = false) => {
            if (!isLoadingMore) {
                setIsLoading(true);
            }
            try {
                if (currentParams.mediaType === "movie") {
                    let movieData;
                    if (currentParams.selectedGenres.length === 0) {
                        movieData = await getPopularMovies(page);
                    } else {
                        movieData = await getDiscoverMovies(currentParams.selectedGenres.join(","), undefined, page);
                    }

                    if (isLoadingMore) {
                        setMovies((prev: ContentResults | null) =>
                            prev
                                ? {
                                      ...prev,
                                      results: [...prev.results, ...movieData.results],
                                      page: movieData.page,
                                  }
                                : movieData
                        );
                    } else {
                        setMovies(movieData);
                    }
                } else {
                    let tvshowData;
                    if (currentParams.selectedGenres.length === 0) {
                        tvshowData = await getPopularTVShows(page);
                    } else {
                        tvshowData = await getDiscoverTVShows(currentParams.selectedGenres.join(","), page);
                    }

                    if (isLoadingMore) {
                        setTVShows((prev: ContentResults | null) =>
                            prev
                                ? {
                                      ...prev,
                                      results: [...prev.results, ...tvshowData.results],
                                      page: tvshowData.page,
                                  }
                                : tvshowData
                        );
                    } else {
                        setTVShows(tvshowData);
                    }
                }
            } catch (error) {
                console.error("Error fetching content:", error);
            }
            setIsLoading(false);
            setIsFetchingMore(false);
        },
        [currentParams.mediaType, currentParams.selectedGenres]
    );

    const fetchGenres = useCallback(async () => {
        try {
            const [movieGenreData, tvshowGenreData] = await Promise.all([getMovieGenres(), getTVShowGenres()]);
            setMovieGenres(movieGenreData);
            setTVShowGenres(tvshowGenreData);
        } catch (error) {
            console.error("Error fetching genres:", error);
        }
    }, []);

    useEffect(() => {
        fetchGenres();
    }, [fetchGenres]);

    useEffect(() => {
        fetchContent(1);
    }, [fetchContent]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const first = entries[0];
                if (first.isIntersecting && !isFetchingMore) {
                    const currentResults = currentParams.mediaType === "movie" ? movies : tvshows;
                    if (currentResults && currentResults.page < currentResults.total_pages) {
                        setIsFetchingMore(true);
                        fetchContent(currentResults.page + 1, true);
                    }
                }
            },
            { threshold: 0.1 }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [fetchContent, isFetchingMore, currentParams.mediaType, movies, tvshows]);

    const handleGenreChange = useCallback(
        (genreId: string, checked: boolean | "indeterminate") => {
            const newGenres =
                checked === true
                    ? [...currentParams.selectedGenres, genreId]
                    : currentParams.selectedGenres.filter((id) => id !== genreId);
            updateUrl(newGenres);
        },
        [currentParams.selectedGenres, updateUrl]
    );

    const handleRemoveGenre = useCallback(
        (genreId: string) => {
            const newGenres = currentParams.selectedGenres.filter((id) => id !== genreId);
            updateUrl(newGenres);
        },
        [currentParams.selectedGenres, updateUrl]
    );

    const handleMediaTypeChange = useCallback(
        (type: string) => {
            updateUrl([], type);
        },
        [updateUrl]
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
        <div className="mb-20 w-full px-5 lg:px-10">
            <div className="mb-8 flex flex-col gap-6">
                <h1 className="text-4xl font-bold">Utforsk</h1>

                <Tabs value={currentParams.mediaType} onValueChange={handleMediaTypeChange} className="w-full">
                    <TabsList className="mb-4">
                        <TabsTrigger value="movie">Filmer</TabsTrigger>
                        <TabsTrigger value="tv">TV-serier</TabsTrigger>
                    </TabsList>

                    <div className="mb-6 space-y-4">
                        <DropdownMenu>
                            <div className="flex flex-row gap-2">
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-[200px] justify-between">
                                        <span className="truncate">
                                            {currentParams.selectedGenres.length === 0
                                                ? "Velg sjangere"
                                                : `${currentParams.selectedGenres.length} valgt`}
                                        </span>
                                        <ChevronDown className="h-4 w-4 opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                            </div>
                            <DropdownMenuContent className="w-[400px] p-4">
                                <div className="grid grid-cols-2 gap-4">
                                    {currentGenres.map((genre) => (
                                        <div key={genre.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`genre-${genre.id}`}
                                                checked={currentParams.selectedGenres.includes(genre.id.toString())}
                                                onCheckedChange={(checked) =>
                                                    handleGenreChange(genre.id.toString(), checked === true)
                                                }
                                            />
                                            <Label htmlFor={`genre-${genre.id}`}>{translateGenre(genre.name)}</Label>
                                        </div>
                                    ))}
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {currentParams.selectedGenres.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex max-w-[400px] flex-wrap gap-2">
                                    {currentParams.selectedGenres.map((genreId) => {
                                        const genre = currentGenres.find((g) => g.id.toString() === genreId);
                                        if (!genre) return null;
                                        return (
                                            <Badge key={genreId} variant="secondary" className="py-1.5 pl-3 pr-2">
                                                {translateGenre(genre.name)}
                                                <button
                                                    onClick={() => handleRemoveGenre(genreId)}
                                                    className="ml-1 hover:text-secondary-foreground"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </Badge>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    <TabsContent value="movie">
                        <MovieList
                            title={
                                currentParams.selectedGenres.length === 0
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
                                currentParams.selectedGenres.length === 0
                                    ? "Populære TV-serier"
                                    : "TV-serier i valgte sjangere"
                            }
                            tvshows={tvshows || { results: [], total_pages: 0, page: 1, total_results: 0 }}
                            isOnFrontPage={false}
                            isLoading={isLoading}
                        />
                    </TabsContent>
                </Tabs>

                {/* Infinite scroll trigger */}
                <div ref={loadMoreRef} className="h-10 w-full">
                    {isFetchingMore && (
                        <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-10 w-10 animate-spin text-filmlista-primary" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
