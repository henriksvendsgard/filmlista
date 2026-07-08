export interface StreamingProvider {
    id: number;
    name: string;
    logoPath: string;
}

// Curated list of Norwegian streaming services (TMDB provider IDs)
const NORWEGIAN_STREAMING_SERVICE_DEFS = [
    { id: 8, name: "Netflix" },
    { id: 119, name: "Prime Video" },
    { id: 337, name: "Disney+" },
    { id: 350, name: "Apple TV+" },
    { id: 1899, name: "Max" },
    { id: 76, name: "Viaplay" },
    { id: 431, name: "TV 2 Play" },
    { id: 1773, name: "SkyShowtime" },
    { id: 531, name: "Paramount+" },
    { id: 442, name: "NRK TV" },
] as const;

// Fallback logos from TMDB (watch_region=NO where available)
const FALLBACK_LOGO_PATHS: Record<number, string> = {
    8: "/pbpMk2JmcoNnQwx5JGpXngfoWtp.jpg",
    119: "/pvske1MyAoymrs5bguRfVqYiM9a.jpg",
    337: "/97yvRBw1GzX7fXprcF80er19ot.jpg",
    350: "/mcbz1LgtErU9p4UdbZ0rG6RTWHX.jpg",
    1899: "/jbe4gVSfRlbPTdESXhEKpornsfu.jpg",
    76: "/bnoTnLzz2MAhK3Yc6P9KXe5drIz.jpg",
    431: "/tpfmd22xEapb1aW2gzjSM5104rx.jpg",
    1773: "/h0ZYcYHicKQ4Ixm5nOjqvwni5NG.jpg",
    531: "/xbhHHa1YgtpwhC8lb1NQ3ACVcLd.jpg",
    442: "/y1PDXoEMqReA1uX1aF8rnVgSYBS.jpg",
};

export const NORWEGIAN_STREAMING_PROVIDERS: StreamingProvider[] = NORWEGIAN_STREAMING_SERVICE_DEFS.map(
    (provider) => ({
        ...provider,
        logoPath: FALLBACK_LOGO_PATHS[provider.id],
    })
);

export function getProviderLogoUrl(logoPath: string, size = "w45"): string {
    return `https://image.tmdb.org/t/p/${size}${logoPath}`;
}

export function getProviderById(id: number): StreamingProvider | undefined {
    return NORWEGIAN_STREAMING_PROVIDERS.find((p) => p.id === id);
}

export async function fetchNorwegianStreamingProviders(): Promise<StreamingProvider[]> {
    try {
        const response = await fetch(
            "https://api.themoviedb.org/3/watch/providers/movie?watch_region=NO&language=no-NO",
            {
                headers: {
                    accept: "application/json",
                    Authorization: `Bearer ${process.env.NEXT_PUBLIC_TMDB_API_KEY}`,
                },
            }
        );

        if (!response.ok) return NORWEGIAN_STREAMING_PROVIDERS;

        const data = await response.json();
        const logoById = new Map<number, string>(
            (data.results ?? []).map((p: { provider_id: number; logo_path: string }) => [
                p.provider_id,
                p.logo_path,
            ])
        );

        return NORWEGIAN_STREAMING_SERVICE_DEFS.map((provider) => ({
            ...provider,
            logoPath: logoById.get(provider.id) ?? FALLBACK_LOGO_PATHS[provider.id],
        }));
    } catch {
        return NORWEGIAN_STREAMING_PROVIDERS;
    }
}
