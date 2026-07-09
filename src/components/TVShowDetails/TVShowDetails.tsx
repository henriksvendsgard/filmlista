"use client";

import { ListMembershipPanel } from "@/components/MediaListPicker/ListMembershipPanel";
import { Button } from "@/components/ui/button";
import { useSupabase } from "@/components/SupabaseProvider";
import { getSimilarTVShows } from "@/lib/getTVShows";
import { TMDBTVShow } from "@/types/tvshow";
import { ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useScrollToTopOnMount } from "@/hooks/useScrollToTopOnMount";

interface TVShowDetailsProps {
    tvshow: TMDBTVShow;
}

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
        Kids: "Barn",
        Music: "Musikk",
        Mystery: "Mysterie",
        News: "Nyheter",
        Reality: "Reality",
        Romance: "Romantikk",
        "Science Fiction": "Science Fiction",
        "Sci-Fi & Fantasy": "Sci-Fi & Fantasy",
        Soap: "Såpeopera",
        Talk: "Talkshow",
        "TV Movie": "TV-Film",
        Thriller: "Thriller",
        War: "Krig",
        "War & Politics": "Krig & Politikk",
        Western: "Western",
    };

    return genreTranslations[genre] || genre;
};

export function TVShowDetails({ tvshow }: TVShowDetailsProps) {
    useScrollToTopOnMount(tvshow.id.toString());
    const [similarShows, setSimilarShows] = useState<TMDBTVShow[]>([]);
    const [isLoadingSimilar, setIsLoadingSimilar] = useState(false);
    const [showAllSeasons, setShowAllSeasons] = useState(false);
    const { user } = useSupabase();
    const router = useRouter();

    const mediaRef = {
        mediaId: tvshow.id.toString(),
        mediaType: "tv" as const,
        title: tvshow.name,
        posterPath: tvshow.poster_path,
        releaseDate: tvshow.first_air_date,
    };

    useEffect(() => {
        const fetchSimilarShows = async () => {
            setIsLoadingSimilar(true);
            try {
                const shows = await getSimilarTVShows(tvshow.id.toString());
                if (shows && Array.isArray(shows)) {
                    setSimilarShows(shows);
                }
            } catch (error) {
                console.error("Error fetching similar shows:", error);
                setSimilarShows([]);
            } finally {
                setIsLoadingSimilar(false);
            }
        };

        fetchSimilarShows();
    }, [tvshow.id]);

    return (
        <div className="space-y-12">
            <div className="relative aspect-[2.76/1] w-full overflow-hidden rounded-xl xl:hidden">
                {tvshow.backdrop_path ? (
                    <Image
                        src={`https://image.tmdb.org/t/p/original${tvshow.backdrop_path || tvshow.poster_path}`}
                        alt={tvshow.name}
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

            <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
                <div className="hidden xl:col-span-1 xl:block">
                    {tvshow.poster_path ? (
                        <Image
                            src={`https://image.tmdb.org/t/p/w500${tvshow.poster_path}`}
                            alt={tvshow.name}
                            width={500}
                            height={750}
                            className="rounded-lg shadow-lg"
                        />
                    ) : (
                        <div className="flex aspect-2/3 items-center justify-center rounded-lg bg-gray-200">
                            <span className="text-gray-400">Ingen plakat</span>
                        </div>
                    )}
                </div>

                <div className="col-span-1 md:col-span-2">
                    <div className="mb-6 flex flex-col gap-4">
                        <h1 className="text-4xl font-bold">{tvshow.name}</h1>

                        <p className="mb-2 text-muted-foreground">
                            {tvshow.first_air_date?.split("-")[0]} • {tvshow.number_of_seasons} sesong
                            {tvshow.number_of_seasons !== 1 ? "er" : ""} • {tvshow.number_of_episodes} episode
                            {tvshow.number_of_episodes !== 1 ? "r" : ""}
                        </p>
                    </div>

                    <div className="mb-8">
                        <h2 className="mb-2 text-2xl font-semibold">Oversikt</h2>
                        <p className="text-muted-foreground">{tvshow.overview || "Ingen beskrivelse tilgjengelig."}</p>
                    </div>

                    <div className="mb-8">
                        <h2 className="mb-4 text-2xl font-semibold">Sjangere</h2>
                        <div className="flex flex-wrap gap-2">
                            {tvshow.genres.map((genre) => (
                                <span key={genre.id} className="rounded-full bg-muted px-3 py-1 text-sm">
                                    {translateGenre(genre.name)}
                                </span>
                            ))}
                        </div>
                    </div>

                    {user && (
                        <div className="mb-8">
                            <ListMembershipPanel media={mediaRef} />
                        </div>
                    )}

                    {tvshow.cast && tvshow.cast.length > 0 && (
                        <div>
                            <h2 className="mb-4 text-2xl font-semibold">Skuespillere</h2>
                            <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
                                {tvshow.cast.map((actor) => (
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

                    {!tvshow.watch_providers && (
                        <h3 className="my-8 text-muted-foreground">
                            Fant ikke tilgjengelige strømmetjenester for denne serien
                        </h3>
                    )}
                    {tvshow.watch_providers && (
                        <div className="my-8 space-y-6 border-b border-t py-8">
                            <h2 className="text-2xl font-semibold">Tilgjengelig på</h2>

                            <div className="grid gap-8 sm:grid-cols-3">
                                {tvshow.watch_providers.flatrate && (
                                    <div>
                                        <h3 className="mb-4 text-lg font-medium">Strøm</h3>
                                        <div className="flex flex-wrap gap-3">
                                            {tvshow.watch_providers.flatrate.map((provider) => (
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

                                {tvshow.watch_providers.rent && (
                                    <div>
                                        <h3 className="mb-4 text-lg font-medium">Leie</h3>
                                        <div className="flex flex-wrap gap-3">
                                            {tvshow.watch_providers.rent.map((provider) => (
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

                                {tvshow.watch_providers.buy && (
                                    <div>
                                        <h3 className="mb-4 text-lg font-medium">Kjøp</h3>
                                        <div className="flex flex-wrap gap-3">
                                            {tvshow.watch_providers.buy.map((provider) => (
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

                            {!tvshow.watch_providers.flatrate &&
                                !tvshow.watch_providers.rent &&
                                !tvshow.watch_providers.buy && (
                                    <p className="text-muted-foreground">
                                        Ikke tilgjengelig på noen strømmetjenester i Norge for øyeblikket.
                                    </p>
                                )}
                        </div>
                    )}

                    <div>
                        <h2 className="mb-4 text-2xl font-semibold">Sesonger</h2>
                        <div className="space-y-4">
                            {(showAllSeasons ? tvshow.seasons : tvshow.seasons.slice(0, 4)).map((season) => (
                                <div
                                    key={season.id}
                                    className="rounded-lg border p-4 transition-colors sm:hover:bg-muted"
                                >
                                    <h3 className="font-semibold">{season.name}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {season.episode_count} episode{season.episode_count !== 1 ? "r" : ""} •{" "}
                                        {season.air_date ? new Date(season.air_date).getFullYear() : "Ukjent dato"}
                                    </p>
                                </div>
                            ))}
                            {!showAllSeasons && tvshow.seasons.length > 4 && (
                                <div className="relative">
                                    <div className="rounded-lg border p-4 opacity-50 transition-colors sm:hover:bg-muted">
                                        <h3 className="font-semibold">{tvshow.seasons[4].name}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {tvshow.seasons[4].episode_count} episode
                                            {tvshow.seasons[4].episode_count !== 1 ? "r" : ""} •{" "}
                                            {tvshow.seasons[4].air_date
                                                ? new Date(tvshow.seasons[4].air_date).getFullYear()
                                                : "Ukjent dato"}
                                        </p>
                                    </div>
                                    <div className="absolute inset-0 bg-linear-to-b from-transparent via-background/50 to-background" />
                                </div>
                            )}
                        </div>
                        {tvshow.seasons.length > 4 && (
                            <Button
                                variant="ghost"
                                className="mt-4 flex w-full items-center justify-center gap-2"
                                onClick={() => setShowAllSeasons(!showAllSeasons)}
                            >
                                {showAllSeasons ? (
                                    <>
                                        Vis mindre <ChevronUp className="h-4 w-4" />
                                    </>
                                ) : (
                                    <>
                                        Vis alle sesonger <ChevronDown className="h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {!isLoadingSimilar && similarShows.length > 0 && (
                <div className="mt-8 space-y-6 border-t pt-16">
                    <h2 className="text-2xl font-semibold">Lignende TV-serier</h2>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                        {similarShows.map((show) => (
                            <div
                                key={show.id}
                                className="group cursor-pointer"
                                onClick={() => router.push(`/tvshow/${show.id}`)}
                            >
                                <div className="relative aspect-2/3 overflow-hidden rounded-lg">
                                    {show.poster_path ? (
                                        <Image
                                            src={`https://image.tmdb.org/t/p/w500${show.poster_path}`}
                                            alt={show.name}
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
