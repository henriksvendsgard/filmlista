"use client";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export interface GenreOption {
    id: number;
    name: string;
}

interface GenreSelectorProps {
    genres: GenreOption[];
    selectedIds: string[];
    onToggle: (genreId: string) => void;
    onClear: () => void;
    translateGenre: (name: string) => string;
    className?: string;
}

export function GenreSelector({
    genres,
    selectedIds,
    onToggle,
    onClear,
    translateGenre,
    className,
}: GenreSelectorProps) {
    return (
        <div className={cn("space-y-1.5", className)}>
            <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Sjangere</p>
                {selectedIds.length > 0 && (
                    <button
                        type="button"
                        onClick={onClear}
                        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <X className="h-3.5 w-3.5" />
                        Nullstill ({selectedIds.length})
                    </button>
                )}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden">
                {genres.map((genre) => {
                    const genreId = genre.id.toString();
                    const selected = selectedIds.includes(genreId);

                    return (
                        <button
                            key={genre.id}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => onToggle(genreId)}
                            className={cn(
                                "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all",
                                selected
                                    ? "border-filmlista-primary/40 bg-filmlista-primary/10 text-filmlista-primary shadow-sm"
                                    : "border-border/70 bg-card/80 text-foreground hover:border-filmlista-primary/25 hover:bg-filmlista-primary/5"
                            )}
                        >
                            {translateGenre(genre.name)}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
