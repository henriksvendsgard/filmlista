"use client";

import { ListMembershipPanel } from "@/components/MediaListPicker/ListMembershipPanel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSupabase } from "@/components/SupabaseProvider";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useScrollToTopOnMount } from "@/hooks/useScrollToTopOnMount";
import { MoviePageData } from "@/lib/tmdb/movies";

interface MovieDetails {
    id: number;
    title: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    release_date: string;
    vote_average: number;
    runtime: number | null;
    genres: { id: number; name: string }[];
}

interface SimilarMovie {
    id: number;
    title: string;
    poster_path: string | null;
    vote_average: number;
    release_date: string;
}

interface Cast {
    id: number;
    name: string;
    character: string;
    profile_path: string | null;
}

interface WatchProvider {
    provider_name: string;
    logo_path: string;
}

interface WatchProviders {
    rent?: WatchProvider[];
    buy?: WatchProvider[];
    flatrate?: WatchProvider[];
}

interface MovieDetailProps {
    movieId: string;
    initialData?: MoviePageData;
}

export default function MovieDetails({ movieId, initialData }: MovieDetailProps) {
    useScrollToTopOnMount(movieId);
    const router = useRouter();
    const [movie, setMovie] = useState<MovieDetails | null>(initialData?.movie ?? null);
    const [cast, setCast] = useState<Cast[]>(initialData?.cast ?? []);
    const [similarMovies, setSimilarMovies] = useState<SimilarMovie[]>(initialData?.similarMovies ?? []);
    const [watchProviders, setWatchProviders] = useState<WatchProviders | null>(initialData?.watchProviders ?? null);
    const [loading, setLoading] = useState(!initialData);
    const [error, setError] = useState<string | null>(null);
    const { user } = useSupabase();

    const mediaRef = {
        mediaId: movieId,
        mediaType: "movie" as const,
        title: movie?.title ?? "",
        posterPath: movie?.poster_path ?? null,
        releaseDate: movie?.release_date,
    };

    useEffect(() => {
        if (initialData) return;

        const fetchMovieData = async () => {
            try {
                const response = await fetch(`/api/tmdb/movie/${movieId}?language=no-NO`);
                const creditsResponse = await fetch(`/api/tmdb/movie/${movieId}/credits`);
                const providersResponse = await fetch(`/api/tmdb/movie/${movieId}/watch/providers`);

                if (!response.ok || !creditsResponse.ok || !providersResponse.ok) {
                    throw new Error("Failed to fetch movie data");
                }

                const [movieData, creditsData, providersData] = await Promise.all([
                    response.json(),
                    creditsResponse.json(),
                    providersResponse.json(),
                ]);

                setMovie(movieData);
                setCast(creditsData.cast?.slice(0, 6) || []);
                setWatchProviders(providersData.results?.NO || null);

                const genreIds = movieData.genres?.map((g: { id: number }) => g.id).join(",") ?? "";
                if (!genreIds) {
                    setLoading(false);
                    return;
                }

                const similarPagesData = await Promise.all(
                    [1, 2, 3].map((page) =>
                        fetch(
                            `/api/tmdb/discover/movie?with_genres=${genreIds}&sort_by=popularity.desc&page=${page}&without_genres=99,10755`
                        ).then((res) => res.json())
                    )
                );

                const filteredSimilarMovies = similarPagesData
                    .flatMap((page) => page.results)
                    .filter((m: SimilarMovie) => m.id !== movieData.id && m.poster_path !== null)
                    .slice(0, 50);

                setSimilarMovies(filteredSimilarMovies);
            } catch (error) {
                console.error("Error:", error);
                setError(error instanceof Error ? error.message : "Klarte ikke hente filmdetaljer");
            } finally {
                setLoading(false);
            }
        };

        fetchMovieData();
    }, [movieId, initialData]);

    if (loading) return <MovieDetailsSkeleton />;
    if (error || !movie) return <ErrorState error={error} onBack={() => router.back()} />;

    return (
        <div className="container mx-auto space-y-8 px-5 sm:py-8">
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Tilbake
            </Button>

            <div className="relative aspect-[2.76/1] w-full overflow-hidden rounded-xl">
                {movie.backdrop_path ? (
                    <Image
                        src={`https://image.tmdb.org/t/p/original${movie.backdrop_path}`}
                        alt={movie.title}
                        fill
                        className="object-cover"
                        priority
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted">
                        <span className="text-muted-foreground">Ingen bakgrunnsbilde tilgjengelig</span>
                    </div>
                )}
            </div>

            <div className="grid gap-8 md:grid-cols-[2fr_1fr]">
                <div className="space-y-8">
                    <div className="mb-6 flex flex-col gap-4">
                        <h1 className="text-4xl font-bold">{movie.title}</h1>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-2 text-muted-foreground">
                        {movie.release_date && <span>{new Date(movie.release_date).getFullYear()}</span>}
                        {movie.runtime && (
                            <>
                                <span>•</span>
                                <span>{movie.runtime} min</span>
                            </>
                        )}
                        {movie.vote_average && (
                            <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                    {movie.vote_average.toFixed(1)}
                                    <span className="text-xs">⭐️</span>
                                </span>
                            </>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {movie.genres.map((genre) => (
                            <div key={genre.id} className="rounded-full bg-muted px-3 py-1 text-sm">
                                {translateGenre(genre.name)}
                            </div>
                        ))}
                    </div>

                    <p className="leading-relaxed text-muted-foreground">{movie.overview}</p>

                    {cast.length > 0 && (
                        <div>
                            <h2 className="mb-4 text-2xl font-semibold">Skuespillere</h2>
                            <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
                                {cast.map((actor) => (
                                    <div key={actor.id} className="flex items-center space-x-4">
                                        <div className="relative h-12 w-12 shrink-0">
                                            {actor.profile_path ? (
                                                <Image
                                                    src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                                                    alt={actor.name}
                                                    fill
                                                    sizes="50px"
                                                    className="rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center rounded-full bg-muted">
                                                    <span className="text-xl">👤</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate font-medium">{actor.name}</p>
                                            <p className="truncate text-sm text-muted-foreground">{actor.character}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div>
                    <div className="sticky top-8 space-y-8">
                        {movie.poster_path ? (
                            <Image
                                src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                                alt={movie.title}
                                width={300}
                                height={450}
                                className="w-full rounded-lg"
                                priority
                            />
                        ) : (
                            <div className="flex aspect-2/3 w-full items-center justify-center rounded-lg bg-muted">
                                <span className="text-muted-foreground">Ingen plakat tilgjengelig</span>
                            </div>
                        )}
                        {user && <ListMembershipPanel media={mediaRef} />}
                    </div>
                </div>
            </div>
            {!watchProviders && (
                <h3 className="text-muted-foreground">Fant ikke tilgjengelige strømmetjenester for denne filmen</h3>
            )}
            {watchProviders && (
                <div className="mt-8 space-y-6 border-t pt-8">
                    <h2 className="text-2xl font-semibold">Tilgjengelig på</h2>

                    <div className="grid gap-8 sm:grid-cols-3">
                        {watchProviders.flatrate && (
                            <div>
                                <h3 className="mb-4 text-lg font-medium">Strøm</h3>
                                <div className="flex flex-wrap gap-3">
                                    {watchProviders.flatrate.map((provider) => (
                                        <div
                                            key={provider.provider_name}
                                            className="tooltip"
                                            data-tip={provider.provider_name}
                                        >
                                            <Image
                                                src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                                                alt={provider.provider_name}
                                                width={50}
                                                height={50}
                                                className="rounded-lg shadow-md transition-shadow hover:shadow-lg"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {watchProviders.rent && (
                            <div>
                                <h3 className="mb-4 text-lg font-medium">Leie</h3>
                                <div className="flex flex-wrap gap-3">
                                    {watchProviders.rent.map((provider) => (
                                        <div
                                            key={provider.provider_name}
                                            className="tooltip"
                                            data-tip={provider.provider_name}
                                        >
                                            <Image
                                                src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                                                alt={provider.provider_name}
                                                width={50}
                                                height={50}
                                                className="rounded-lg shadow-md transition-shadow hover:shadow-lg"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {watchProviders.buy && (
                            <div>
                                <h3 className="mb-4 text-lg font-medium">Kjøp</h3>
                                <div className="flex flex-wrap gap-3">
                                    {watchProviders.buy.map((provider) => (
                                        <div
                                            key={provider.provider_name}
                                            className="tooltip"
                                            data-tip={provider.provider_name}
                                        >
                                            <Image
                                                src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                                                alt={provider.provider_name}
                                                width={50}
                                                height={50}
                                                className="rounded-lg shadow-md transition-shadow hover:shadow-lg"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {!watchProviders.flatrate && !watchProviders.rent && !watchProviders.buy && (
                        <p className="text-muted-foreground">
                            Ikke tilgjengelig på noen strømmetjenester i Norge for øyeblikket.
                        </p>
                    )}
                </div>
            )}

            {similarMovies.length > 0 && (
                <div className="mt-8 space-y-6 border-t pt-16">
                    <h2 className="text-2xl font-semibold">Lignende filmer</h2>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                        {similarMovies.map((movie) => (
                            <div
                                key={movie.id}
                                className="group cursor-pointer"
                                onClick={() => router.push(`/movie/${movie.id}`)}
                            >
                                <div className="relative aspect-2/3 overflow-hidden rounded-lg">
                                    {movie.poster_path ? (
                                        <Image
                                            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                                            alt={movie.title}
                                            fill
                                            className="object-cover transition-transform group-hover:scale-105"
                                            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-muted">
                                            <span className="text-muted-foreground">Ingen plakat</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function ErrorState({ error, onBack }: { error: string | null; onBack: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center space-y-4 p-8">
            <h1 className="text-2xl font-bold text-red-500">Feil</h1>
            <p className="text-muted-foreground">{error || "Fant ikke filmen"}</p>
            <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Tilbake
            </Button>
        </div>
    );
}

function MovieDetailsSkeleton() {
    return (
        <div className="container mx-auto space-y-8 px-4 py-8">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="aspect-[2.76/1] w-full rounded-xl" />
            <div className="grid gap-8 md:grid-cols-[2fr_1fr]">
                <div className="space-y-6">
                    <div>
                        <Skeleton className="mb-4 h-12 w-3/4" />
                        <Skeleton className="mb-10 h-12 w-12 rounded-full" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-8 w-20 rounded-full" />
                        ))}
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                    <div className="space-y-4">
                        <Skeleton className="h-8 w-40" />
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="flex items-center space-x-3">
                                    <Skeleton className="h-[45px] w-[45px] rounded-full" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-3 w-20" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div>
                    <Skeleton className="aspect-2/3 w-full rounded-lg" />
                </div>
            </div>
            <div className="space-y-4">
                <Skeleton className="h-8 w-40" />
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="space-y-2">
                            <Skeleton className="aspect-2/3 w-full rounded-lg" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function translateGenre(genre: string): string {
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
}
