"use client";

import { cn } from "@/lib/utils";
import { Film, Tv, type LucideIcon } from "lucide-react";

export type MediaType = "movie" | "tv";

interface MediaTypeSelectorProps {
    value: MediaType;
    onChange: (value: MediaType) => void;
    movieCount?: number;
    tvCount?: number;
    label?: string;
    className?: string;
}

function MediaTypeCard({
    icon: Icon,
    label,
    count,
    active,
    onClick,
}: {
    icon: LucideIcon;
    label: string;
    count?: number;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            aria-pressed={active}
            onClick={onClick}
            className={cn(
                "flex min-w-[140px] flex-1 items-center gap-2 rounded-xl border px-3 py-2 text-left shadow-sm transition-all sm:min-w-[160px] sm:flex-none",
                active
                    ? "border-filmlista-primary/40 bg-filmlista-primary/10 ring-1 ring-filmlista-primary/20"
                    : "border-border/70 bg-card/80 hover:border-filmlista-primary/25 hover:bg-filmlista-primary/5"
            )}
        >
            <div
                className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                    active ? "bg-filmlista-primary text-white" : "bg-filmlista-primary/10 text-filmlista-primary"
                )}
            >
                <Icon className="h-4 w-4" />
            </div>
            <div>
                {count !== undefined ? (
                    <>
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="font-heading text-lg font-semibold leading-none">{count}</p>
                    </>
                ) : (
                    <p className="font-heading text-sm font-semibold">{label}</p>
                )}
            </div>
        </button>
    );
}

export function MediaTypeSelector({
    value,
    onChange,
    movieCount,
    tvCount,
    label = "Type innhold",
    className,
}: MediaTypeSelectorProps) {
    return (
        <div className={cn("space-y-1.5", className)}>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            <div className="flex flex-wrap gap-2 sm:gap-3">
                <MediaTypeCard
                    icon={Film}
                    label="Filmer"
                    count={movieCount}
                    active={value === "movie"}
                    onClick={() => onChange("movie")}
                />
                <MediaTypeCard
                    icon={Tv}
                    label="TV-serier"
                    count={tvCount}
                    active={value === "tv"}
                    onClick={() => onChange("tv")}
                />
            </div>
        </div>
    );
}
