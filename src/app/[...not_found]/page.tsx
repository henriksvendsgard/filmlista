"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Clapperboard, Film, Home } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Custom404() {
    const router = useRouter();

    return (
        <div className="flex min-h-[65vh] w-full items-center justify-center px-5 py-16">
            <div className="relative mx-auto w-full max-w-xl text-center">
                <div
                    className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-filmlista-primary/15 blur-3xl"
                    aria-hidden
                />
                <p
                    className="font-heading text-8xl font-semibold leading-none text-filmlista-primary/15 sm:text-9xl"
                    aria-hidden
                >
                    404
                </p>

                <div className="relative -mt-10 space-y-4 sm:-mt-12">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-filmlista-primary/10 text-filmlista-primary">
                        <Film className="h-7 w-7" />
                    </div>

                    <div className="space-y-2">
                        <p className="text-sm font-medium uppercase tracking-[0.2em] text-filmlista-primary">
                            Siden finnes ikke
                        </p>
                        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                            Husj! Scenen er tom
                        </h1>
                        <p className="mx-auto max-w-md text-sm text-muted-foreground sm:text-base">
                            Lenken kan være feil, eller siden kan ha blitt flyttet. La oss finne deg tilbake til
                            filmkvelden.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            className="gap-2 rounded-full"
                            onClick={() => router.back()}
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Gå tilbake
                        </Button>
                        <Button asChild className="gap-2 rounded-full bg-filmlista-primary hover:bg-filmlista-hover">
                            <Link href="/">
                                <Home className="h-4 w-4" />
                                Til forsiden
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="gap-2 rounded-full">
                            <Link href="/watchlist">
                                <Clapperboard className="h-4 w-4" />
                                Filmlista
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
