"use client";

import { Button } from "@/components/ui/button";
import { useSupabase } from "@/components/SupabaseProvider";
import { getPopularMovies } from "@/lib/getMovies";
import { Movie } from "@/lib/typings";
import { ArrowDown, Clapperboard, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

function backdropUrl(path: string) {
    return `https://image.tmdb.org/t/p/w1280${path}`;
}

function posterUrl(path: string) {
    return `https://image.tmdb.org/t/p/w342${path}`;
}

export function LandingHero() {
    const { user } = useSupabase();
    const [featured, setFeatured] = useState<Movie[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        let cancelled = false;

        getPopularMovies(1)
            .then((data) => {
                if (cancelled) return;
                const picks = data.results
                    .filter((movie) => movie.backdrop_path && movie.poster_path)
                    .slice(0, 6);
                setFeatured(picks);
            })
            .catch((error) => {
                console.error("Error loading hero movies:", error);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (featured.length <= 1) return;

        const interval = window.setInterval(() => {
            setActiveIndex((index) => (index + 1) % featured.length);
        }, 7000);

        return () => window.clearInterval(interval);
    }, [featured.length]);

    const activeMovie = featured[activeIndex];
    const posterStrip = useMemo(() => featured.slice(0, 4), [featured]);

    const firstName = user?.user_metadata?.display_name?.split(" ")?.[0];
    const headline = user
        ? firstName
            ? `Hei ${firstName}, hva vil du se i kveld?`
            : "Velkommen tilbake til Filmlista"
        : "Filmkvelden starter her";

    const subline = user
        ? "Utforsk nye filmer og serier, filtrer på tjenestene dine, og hold oversikten sammen med venner."
        : "Lag delte filmlister, filtrer på strømmetjenestene dine, og finn neste filmkveld på sekunder.";

    const scrollToExplore = () => {
        document.getElementById("utforsk")?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    return (
        <section className="landing-hero relative -mt-40 w-full overflow-hidden">
            <div className="absolute inset-0">
                {featured.map((movie, index) => (
                    <div
                        key={movie.id}
                        className="absolute inset-0 transition-opacity duration-[1800ms] ease-in-out"
                        style={{ opacity: index === activeIndex ? 1 : 0 }}
                    >
                        {movie.backdrop_path && (
                            <Image
                                src={backdropUrl(movie.backdrop_path)}
                                alt=""
                                fill
                                priority={index === 0}
                                className="landing-hero__backdrop object-cover"
                                sizes="100vw"
                                unoptimized
                            />
                        )}
                    </div>
                ))}

                <div className="absolute inset-0 bg-linear-to-t from-background via-background/85 to-background/20" />
                <div className="absolute inset-0 bg-linear-to-r from-background/90 via-background/35 to-transparent" />
                <div className="landing-hero__glow absolute -right-24 top-20 h-72 w-72 rounded-full bg-filmlista-primary/30 blur-3xl" />
                <div className="landing-hero__glow absolute -left-16 bottom-32 h-56 w-56 rounded-full bg-filmlista-primary/20 blur-3xl" />
            </div>

            <div className="relative z-10 mx-auto flex min-h-[88vh] max-w-6xl flex-col justify-end px-5 pb-14 pt-48 lg:px-10 lg:pb-20">
                <div className="grid items-end gap-10 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="landing-hero__content space-y-6">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm">
                            <Sparkles className="h-3.5 w-3.5 text-filmlista-primary" />
                            Skap filmglede med venner
                        </div>

                        <div className="space-y-4">
                            <h1 className="font-heading text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                                {headline}
                            </h1>
                            <p className="max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
                                {subline}
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            {user ? (
                                <>
                                    <Button
                                        asChild
                                        size="lg"
                                        className="rounded-full bg-filmlista-primary px-6 hover:bg-filmlista-hover text-white"
                                    >
                                        <Link href="/watchlist">
                                            <Clapperboard className="mr-2 h-4 w-4" />
                                            Gå til lista
                                        </Link>
                                    </Button>
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        className="rounded-full border-white/20 bg-white/5 text-white backdrop-blur-sm hover:bg-white/10 hover:text-white"
                                        onClick={scrollToExplore}
                                    >
                                        Utforsk titler
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        asChild
                                        size="lg"
                                        className="rounded-full bg-filmlista-primary px-6 hover:bg-filmlista-hover"
                                    >
                                        <Link href="/login">Kom i gang gratis</Link>
                                    </Button>
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        className="rounded-full border-white/20 bg-white/5 text-white backdrop-blur-sm hover:bg-white/10 hover:text-white"
                                        onClick={scrollToExplore}
                                    >
                                        Se hva som er populært
                                    </Button>
                                </>
                            )}
                        </div>

                        {activeMovie && (
                            <div className="hidden max-w-xl rounded-2xl border border-white/10 bg-black/25 p-4 backdrop-blur-md sm:block">
                                <p className="text-xs font-medium uppercase tracking-[0.2em] text-filmlista-primary">
                                    Utvalgt akkurat nå
                                </p>
                                <p className="mt-1 font-heading text-lg font-semibold text-white">{activeMovie.title}</p>
                                <p className="mt-2 line-clamp-2 text-sm text-white/70">{activeMovie.overview}</p>
                            </div>
                        )}
                    </div>

                    {posterStrip.length > 0 && (
                        <div className="landing-hero__posters relative hidden h-[360px] lg:block">
                            {posterStrip.map((movie, index) => (
                                <Link
                                    key={movie.id}
                                    href={`/movie/${movie.id}`}
                                    className="landing-hero__poster absolute overflow-hidden rounded-2xl border border-white/15 shadow-2xl shadow-black/40 transition-transform duration-500 hover:scale-[1.03] hover:z-20"
                                    style={{
                                        width: 168,
                                        height: 252,
                                        left: index * 54,
                                        top: index * 18,
                                        transform: `rotate(${index * 4 - 6}deg)`,
                                        zIndex: index + 1,
                                    }}
                                >
                                    {movie.poster_path && (
                                        <Image
                                            src={posterUrl(movie.poster_path)}
                                            alt={movie.title}
                                            fill
                                            className="object-cover"
                                            sizes="168px"
                                            unoptimized
                                        />
                                    )}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                <button
                    type="button"
                    onClick={scrollToExplore}
                    className="landing-hero__scroll mt-10 flex w-fit items-center gap-2 text-sm text-white/60 transition-colors hover:text-white"
                    aria-label="Scroll til utforsk"
                >
                    <span>Utforsk katalogen</span>
                    <ArrowDown className="h-4 w-4 animate-bounce" />
                </button>
            </div>
        </section>
    );
}
