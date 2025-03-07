"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function TVShowCardSkeleton() {
    return (
        <div className="group relative">
            {/* Poster skeleton with proper sizing */}
            <div className="aspect-[2/3] overflow-hidden rounded-lg">
                <div className="inset-0 h-[750px] w-[500px] animate-pulse bg-muted" />
            </div>
        </div>
    );
}

export function TVShowGridSkeleton() {
    return (
        <>
            <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {Array.from({ length: 20 }).map((_, i) => (
                    <div key={i} className="">
                        <TVShowCardSkeleton />
                    </div>
                ))}
            </div>
        </>
    );
}
