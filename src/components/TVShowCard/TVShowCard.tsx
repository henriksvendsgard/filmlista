"use client";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TMDBTVShow } from "@/types/tvshow";
import { Ellipsis } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface List {
	id: string;
	name: string;
	owner_id: string;
}

interface TVShowCardProps {
	tvshow: TMDBTVShow;
	lists: {
		owned: List[];
		shared: List[];
	};
	onAddToList: (tvshow: TMDBTVShow, listId: string) => void;
	onRemoveFromList: (tvshow: TMDBTVShow, listId: string) => void;
	isInLists: string[];
	hasOthersWatched: boolean;
	othersWhoWatched: { user_id: string; displayname: string; watched_at: string }[];
	showAddedBy?: string;
	isLoadingListMap: boolean;
}

export function TVShowCard({ tvshow, lists, onAddToList, onRemoveFromList, isInLists, hasOthersWatched, othersWhoWatched, showAddedBy }: TVShowCardProps) {
	const allLists = [...lists.owned, ...lists.shared];
	const availableOwnedLists = lists.owned.filter((list) => !isInLists.includes(list.id));
	const availableSharedLists = lists.shared.filter((list) => !isInLists.includes(list.id));

	return (
		<div className="group relative">
			<Link href={`/tvshow/${tvshow.id}`} className="block">
				<div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-muted/50 cursor-pointer transition-all duration-300">
					{tvshow.poster_path ? (
						<Image
							src={`https://image.tmdb.org/t/p/w500${tvshow.poster_path}`}
							alt={tvshow.name}
							width={500}
							height={750}
							className="object-cover h-full w-full transition-all hover:scale-105 cursor-pointer"
						/>
					) : (
						<div className="flex h-full items-center justify-center bg-gray-200">
							<span className="text-gray-400">No image</span>
						</div>
					)}
				</div>
			</Link>

			<div className="absolute top-2 right-2">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" size="icon" className="rounded-full">
							<Ellipsis className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-56">
						{availableOwnedLists.length > 0 && (
							<>
								<DropdownMenuItem disabled className="text-muted-foreground">
									Dine lister
								</DropdownMenuItem>
								{availableOwnedLists.map((list) => (
									<DropdownMenuItem key={list.id} onClick={() => onAddToList(tvshow, list.id)}>
										Legg til i {list.name}
									</DropdownMenuItem>
								))}
							</>
						)}

						{availableSharedLists.length > 0 && (
							<>
								{availableOwnedLists.length > 0 && <DropdownMenuSeparator />}
								<DropdownMenuItem disabled className="text-muted-foreground">
									Delte lister
								</DropdownMenuItem>
								{availableSharedLists.map((list) => (
									<DropdownMenuItem key={list.id} onClick={() => onAddToList(tvshow, list.id)}>
										Legg til i {list.name}
									</DropdownMenuItem>
								))}
							</>
						)}

						{isInLists.length > 0 && (
							<>
								{(availableOwnedLists.length > 0 || availableSharedLists.length > 0) && <DropdownMenuSeparator />}
								<DropdownMenuItem disabled className="text-muted-foreground">
									Fjern fra listen
								</DropdownMenuItem>
								{allLists
									.filter((list) => isInLists.includes(list.id))
									.map((list) => (
										<DropdownMenuItem key={list.id} onClick={() => onRemoveFromList(tvshow, list.id)} className="text-red-600">
											{list.name}
										</DropdownMenuItem>
									))}
							</>
						)}

						{!availableOwnedLists.length && !availableSharedLists.length && !isInLists.length && <DropdownMenuItem disabled>Ingen lister tilgjengelig</DropdownMenuItem>}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			<div className="absolute bottom-0 left-0 right-0 p-2">
				<div className="flex justify-between items-end">
					<div className="flex-1">
						{hasOthersWatched && (
							<div className="mb-1">
								<Dialog>
									<DialogTrigger asChild>
										<Badge variant="secondary" className="text-xs cursor-pointer hover:bg-secondary/80">
											Sett av {othersWhoWatched.length} {othersWhoWatched.length === 1 ? "annen" : "andre"}
										</Badge>
									</DialogTrigger>
									<DialogContent>
										<DialogHeader>
											<DialogTitle>Sett av</DialogTitle>
										</DialogHeader>
										<div className="space-y-2">
											{othersWhoWatched.map((watcher) => (
												<div key={watcher.user_id} className="text-sm">
													{watcher.displayname}
													<span className="text-muted-foreground ml-2">{new Date(watcher.watched_at).toLocaleDateString()}</span>
												</div>
											))}
										</div>
									</DialogContent>
								</Dialog>
							</div>
						)}
						{showAddedBy && <p className="text-xs text-white bg-black/60 rounded-md px-2 py-1 w-fit">Lagt til av {showAddedBy}</p>}
					</div>
				</div>
			</div>
		</div>
	);
}
