export interface WatchlistContentResults {
    results: unknown[];
    total_pages: number;
    page: number;
    total_results: number;
}

export interface WatchlistEntry {
    scrollY: number;
    upcomingMovies: WatchlistContentResults | null;
}

const entries = new Map<string, WatchlistEntry>();

export function getWatchlistKey(search: string): string {
    return search ? `/watchlist?${search}` : "/watchlist";
}

export function getWatchlistEntry(key: string): WatchlistEntry | undefined {
    return entries.get(key);
}

export function updateWatchlistEntry(key: string, update: Partial<WatchlistEntry>) {
    const prev = entries.get(key) ?? { scrollY: 0, upcomingMovies: null };
    entries.set(key, { ...prev, ...update });
}

export function saveWatchlistScroll(key: string, scrollY?: number) {
    if (typeof window === "undefined") return;
    const y = scrollY ?? window.scrollY;
    if (y <= 0) return;
    updateWatchlistEntry(key, { scrollY: y });
}
