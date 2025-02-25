"use client";

import { Button } from "@/components/ui/button";
import { TMDBTVShow } from "@/types/tvshow";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { TVShowCard } from "../TVShowCard/TVShowCard";
import { TVShowGridSkeleton } from "../TVShowList/TVShowCardSkeleton";

interface List {
	id: string;
	name: string;
	owner_id: string;
}

interface TVShowListProps {
	tvshows: {
		results: TMDBTVShow[];
		total_pages: number;
		page: number;
		total_results: number;
	};
	title: string;
	isOnFrontPage?: boolean;
	isLoading?: boolean;
}

interface TVShowDetails {
	added_at: string;
	added_by: string;
	added_by_email: string;
}

type RawListTVShow = {
	tvshow_id: string;
	list_id: string;
	added_at: string;
	added_by: string;
	profile: {
		email: string;
	};
};

type TVShowListAction = {
	type: "added" | "removed";
	listId: string;
	tvshowId: string;
};

export default function TVShowList({ tvshows, title, isOnFrontPage, isLoading }: TVShowListProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [lists, setLists] = useState<{ owned: List[]; shared: List[] }>({ owned: [], shared: [] });
	const [tvshowListMap, setTVShowListMap] = useState<{ [key: string]: string[] }>({});
	const [tvshowDetails, setTVShowDetails] = useState<{ [key: string]: TVShowDetails }>({});

	const supabase = createClientComponentClient();

	const fetchLists = useCallback(async () => {
		const {
			data: { user },
			error: userError,
		} = await supabase.auth.getUser();
		if (userError) {
			console.error("Error fetching user:", userError);
			return;
		}
		if (!user) return;

		try {
			const { data: sharedListIds, error: sharedError } = await supabase.from("shared_lists").select("list_id").eq("user_id", user.id);

			if (sharedError) throw sharedError;

			const { data: allLists, error: listsError } = await supabase.from("lists").select("*");

			if (listsError) throw listsError;

			const sharedListIdsArray = (sharedListIds || []).map((item) => item.list_id);
			const ownedLists = allLists.filter((list) => list.owner_id === user.id);
			const sharedLists = allLists.filter((list) => sharedListIdsArray.includes(list.id));

			setLists({
				owned: ownedLists || [],
				shared: sharedLists || [],
			});
		} catch (error) {
			console.error("Error fetching lists:", error);
			toast({
				title: "Error",
				description: "Failed to fetch lists",
				variant: "destructive",
			});
		}
	}, [supabase]);

	const handleAddToList = async (tvshow: TMDBTVShow, listId: string) => {
		try {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) return;

			// First, delete any existing watched status for this TV show in this list
			const { error: watchedError } = await supabase.from("watched_tvshows").delete().eq("list_id", listId).eq("tvshow_id", tvshow.id.toString());
			if (watchedError) throw watchedError;

			// Then add the TV show to the list
			const { error } = await supabase.from("list_tvshows").insert({
				list_id: listId,
				tvshow_id: tvshow.id.toString(),
				title: tvshow.name,
				poster_path: tvshow.poster_path,
				added_by: user.id,
			});

			if (error) throw error;

			setTVShowListMap((prev) => ({
				...prev,
				[tvshow.id.toString()]: [...(prev[tvshow.id.toString()] || []), listId],
			}));

			const event = new CustomEvent("tvshowListUpdate", {
				detail: {
					type: "added",
					listId,
					tvshowId: tvshow.id.toString(),
				} as TVShowListAction,
			});
			window.dispatchEvent(event);

			toast({
				title: "TV-serie lagt til i listen",
				description: `"${tvshow.name}" er nå lagt til i lista`,
				className: "bg-blue-800",
			});
		} catch (error) {
			console.error("Error adding TV show to list:", error);
			toast({
				title: "Feil",
				description: "Kunne ikke legge til TV-serien i listen",
				variant: "destructive",
			});
		}
	};

	const handleRemoveFromList = async (tvshow: TMDBTVShow, listId: string) => {
		try {
			const { error } = await supabase.from("list_tvshows").delete().eq("tvshow_id", tvshow.id.toString()).eq("list_id", listId);

			if (error) throw error;

			setTVShowListMap((prev) => {
				const newMap = { ...prev };
				const tvshowId = tvshow.id.toString();
				if (newMap[tvshowId]) {
					newMap[tvshowId] = newMap[tvshowId].filter((id) => id !== listId);
					if (newMap[tvshowId].length === 0) {
						delete newMap[tvshowId];
					}
				}
				return newMap;
			});

			const event = new CustomEvent("tvshowListUpdate", {
				detail: {
					type: "removed",
					listId,
					tvshowId: tvshow.id.toString(),
				} as TVShowListAction,
			});
			window.dispatchEvent(event);

			toast({
				title: "TV-serie fjernet fra listen",
				description: `"${tvshow.name}" er nå fjernet fra lista`,
				className: "bg-orange-800",
			});
		} catch (error) {
			console.error("Error removing TV show from list:", error);
			toast({
				title: "Feil",
				description: "Kunne ikke fjerne TV-serien fra listen",
				variant: "destructive",
			});
		}
	};

	const createPageURL = (pageNumber: number) => {
		const params = new URLSearchParams(Array.from(searchParams.entries()));
		params.set("page", pageNumber.toString());
		return `${pathname}?${params.toString()}`;
	};

	const paginate = (pageNumber: number) => {
		router.push(createPageURL(pageNumber));
		window.scrollTo({
			top: 0,
			behavior: "smooth",
		});
	};

	useEffect(() => {
		fetchLists();
	}, [fetchLists]);

	if (isLoading) {
		return <TVShowGridSkeleton />;
	}

	return (
		<section className="tv-show-list w-full h-full max-w-full">
			<h2 className="text-3xl font-bold tracking-tight mb-6">{title}</h2>

			<div className="w-full max-w-full">
				{isLoading ? (
					<TVShowGridSkeleton />
				) : (
					<>
						<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
							{tvshows.results.map((tvshow) => (
								<TVShowCard
									key={tvshow.id}
									tvshow={tvshow}
									lists={lists}
									onAddToList={handleAddToList}
									onRemoveFromList={handleRemoveFromList}
									isInLists={tvshowListMap[tvshow.id.toString()] || []}
								/>
							))}
						</div>
					</>
				)}
			</div>

			{isOnFrontPage && tvshows.total_pages > 1 && !isLoading && (
				<div className="flex justify-center items-center gap-6 mt-8 mb-12">
					<Button variant="outline" onClick={() => paginate(tvshows.page - 1)} disabled={tvshows.page === 1} className="h-10">
						<ChevronLeft className="h-4 w-4 sm:mr-2" />
						<span className="hidden sm:inline">Forrige</span>
					</Button>

					<div className="flex items-center">
						<span className="text-sm">Side {tvshows.page}</span>
					</div>

					<Button variant="outline" onClick={() => paginate(tvshows.page + 1)} disabled={tvshows.page === Math.min(tvshows.total_pages, 500)} className="h-10">
						<span className="hidden sm:inline">Neste</span>
						<ChevronRight className="h-4 w-4 sm:ml-2" />
					</Button>
				</div>
			)}
		</section>
	);
}
