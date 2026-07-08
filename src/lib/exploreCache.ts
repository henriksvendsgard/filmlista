export interface ExploreContentResults {
    results: unknown[];
    total_pages: number;
    page: number;
    total_results: number;
}

export interface ExploreEntry {
    movies: ExploreContentResults | null;
    tvshows: ExploreContentResults | null;
    scrollY: number;
}

const entries = new Map<string, ExploreEntry>();

let genreCache: {
    movieGenres: { id: number; name: string }[];
    tvshowGenres: { id: number; name: string }[];
} = { movieGenres: [], tvshowGenres: [] };

export function getExploreKey(search: string): string {
    return search ? `/?${search}` : "/";
}

export function getExploreEntry(key: string): ExploreEntry | undefined {
    return entries.get(key);
}

export function updateExploreEntry(key: string, update: Partial<ExploreEntry>) {
    const prev = entries.get(key) ?? { movies: null, tvshows: null, scrollY: 0 };
    entries.set(key, { ...prev, ...update });
}

export function saveExploreScroll(key: string, scrollY?: number) {
    if (typeof window === "undefined") return;
    const y = scrollY ?? window.scrollY;
    if (y <= 0) return;
    updateExploreEntry(key, { scrollY: y });
}

export function setExploreGenreCache(movieGenres: { id: number; name: string }[], tvshowGenres: { id: number; name: string }[]) {
    genreCache = { movieGenres, tvshowGenres };
}

export function getExploreGenreCache() {
    return genreCache;
}
