"use client";

import { useSupabase } from "@/components/SupabaseProvider";
import { ListChecks, Share2, Sparkles, Tv } from "lucide-react";
import Link from "next/link";

const features = [
    {
        icon: ListChecks,
        title: "Delte filmlister",
        description: "Samle filmer og serier på én liste sammen med venner — alltid oppdatert.",
    },
    {
        icon: Tv,
        title: "Dine strømmetjenester",
        description: "Filtrer på Netflix, Disney+, Viaplay og mer, så dere slipper å lete forgjeves.",
    },
    {
        icon: Share2,
        title: "Bygget for filmkvelder",
        description: "Marker som sett, del lister, og finn raskt noe alle faktisk kan se.",
    },
    {
        icon: Sparkles,
        title: "Utforsk og søk",
        description: "Populære titler, sjangere og smart søk — rett fra forsiden.",
    },
] as const;

export function LandingFeatures() {
    const { user } = useSupabase();

    return (
        <section className="relative z-10 px-5 lg:px-10">
            <div className="-mt-6 mx-auto grid max-w-6xl grid-cols-2 gap-2 sm:gap-3 md:-mt-10 md:grid-cols-2 md:gap-4 xl:grid-cols-4">
                {features.map((feature, index) => (
                    <article
                        key={feature.title}
                        className="landing-feature group rounded-xl border border-border/70 bg-card/80 p-2.5 shadow-md shadow-black/5 backdrop-blur-sm transition-all duration-300 sm:rounded-2xl sm:p-4 md:p-5 md:hover:-translate-y-1 md:hover:border-filmlista-primary/30 md:hover:shadow-xl md:hover:shadow-filmlista-primary/10"
                        style={{ animationDelay: `${index * 80}ms` }}
                    >
                        <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-filmlista-primary/10 text-filmlista-primary transition-colors group-hover:bg-filmlista-primary group-hover:text-white sm:mb-3 sm:h-10 sm:w-10 sm:rounded-xl md:mb-4 md:h-11 md:w-11">
                            <feature.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                        <h2 className="font-heading text-xs font-semibold leading-tight sm:text-base md:text-lg">
                            {feature.title}
                        </h2>
                        <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted-foreground sm:mt-2 sm:line-clamp-none sm:text-sm sm:leading-relaxed">
                            {feature.description}
                        </p>
                    </article>
                ))}
            </div>

            {!user && (
                <p className="mx-auto mt-5 max-w-6xl text-center text-xs text-muted-foreground sm:mt-8 sm:text-sm">
                    Klar for neste filmkveld?{" "}
                    <Link href="/login" className="font-medium text-filmlista-primary underline-offset-4 hover:underline">
                        Opprett konto
                    </Link>{" "}
                    eller scroll ned for å utforske titler med en gang.
                </p>
            )}
        </section>
    );
}
