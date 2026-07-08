export interface WatchProviderEntry {
    provider_id: number;
    provider_name: string;
    logo_path: string;
}

export interface WatchProvidersNO {
    flatrate?: WatchProviderEntry[];
    rent?: WatchProviderEntry[];
    buy?: WatchProviderEntry[];
}

export type MonetizationType = "flatrate" | "rent" | "buy";

export function getProviderIds(
    providers: WatchProvidersNO | null | undefined,
    types: MonetizationType[] = ["flatrate"]
): number[] {
    if (!providers) return [];

    const ids = new Set<number>();
    for (const type of types) {
        providers[type]?.forEach((p) => ids.add(p.provider_id));
    }
    return Array.from(ids);
}

export function isAvailableOnServices(providerIds: number[], userServiceIds: number[]): boolean {
    if (userServiceIds.length === 0) return true;
    return userServiceIds.some((id) => providerIds.includes(id));
}

export function matchesUserServices(
    providers: WatchProvidersNO | null | undefined,
    userServiceIds: number[],
    monetizationTypes: MonetizationType[] = ["flatrate", "rent", "buy"]
): boolean {
    if (userServiceIds.length === 0) return true;
    const providerIds = getProviderIds(providers, monetizationTypes);
    return isAvailableOnServices(providerIds, userServiceIds);
}

interface MediaItem {
    mediaId: string;
    mediaType: "movie" | "tv";
}

export async function fetchWatchProviders(
    mediaId: string,
    mediaType: "movie" | "tv"
): Promise<WatchProvidersNO | null> {
    const url = `https://api.themoviedb.org/3/${mediaType}/${mediaId}/watch/providers`;

    const response = await fetch(url, {
        headers: {
            accept: "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_TMDB_API_KEY}`,
        },
        next: { revalidate: 60 * 60 * 6 },
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.results?.NO ?? null;
}

async function fetchWithConcurrency<T, R>(
    items: T[],
    fn: (item: T) => Promise<R>,
    concurrency = 5
): Promise<R[]> {
    const results: R[] = [];
    for (let i = 0; i < items.length; i += concurrency) {
        const chunk = items.slice(i, i + concurrency);
        const chunkResults = await Promise.all(chunk.map(fn));
        results.push(...chunkResults);
    }
    return results;
}

export async function fetchWatchProvidersBatch(
    items: MediaItem[]
): Promise<Map<string, WatchProvidersNO | null>> {
    const results = await fetchWithConcurrency(items, async (item) => {
        const providers = await fetchWatchProviders(item.mediaId, item.mediaType);
        return { key: `${item.mediaType}:${item.mediaId}`, providers };
    });

    const map = new Map<string, WatchProvidersNO | null>();
    for (const { key, providers } of results) {
        map.set(key, providers);
    }
    return map;
}
