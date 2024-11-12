import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: "Watcher - Movie Watchlist",
		short_name: "Watcher",
		start_url: "/",
		display: "fullscreen",
		background_color: "#09090b",
		theme_color: "#09090b",
		icons: [
			{
				src: "/icons/watcher_192x192.png",
				sizes: "192x192",
				type: "image/png",
			},
			{
				src: "/icons/watcher_512x512.png",
				sizes: "512x512",
				type: "image/png",
			},
		],
	};
}
