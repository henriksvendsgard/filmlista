"use client";

import { MediaListPicker } from "@/components/MediaListPicker/MediaListPicker";
import { MediaRef } from "@/contexts/ListActionsContext";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { List } from "@/lib/listRepository";
import { TMDBTVShow } from "@/types/tvshow";
import Image from "next/image";
import Link from "next/link";

interface TVShowCardProps {
    tvshow: TMDBTVShow;
    media: MediaRef;
    lists: {
        owned: List[];
        shared: List[];
    };
    isInLists: string[];
    listCount?: number;
    hasOthersWatched: boolean;
    othersWhoWatched: { user_id: string; displayname: string; watched_at: string }[];
    showAddedBy?: string;
}

export function TVShowCard({
    tvshow,
    media,
    isInLists,
    listCount = 0,
    hasOthersWatched,
    othersWhoWatched,
    showAddedBy,
}: TVShowCardProps) {
    return (
        <div className="group relative">
            <Link href={`/tvshow/${tvshow.id}`} className="block">
                <div className="relative aspect-2/3 cursor-pointer overflow-hidden rounded-lg bg-muted/50 transition-all duration-300">
                    {tvshow.poster_path ? (
                        <Image
                            src={`https://image.tmdb.org/t/p/w500${tvshow.poster_path}`}
                            alt={tvshow.name}
                            width={500}
                            height={750}
                            className="h-full w-full cursor-pointer object-cover transition-all sm:hover:scale-105"
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center bg-gray-200">
                            <span className="text-gray-400">No image</span>
                        </div>
                    )}
                </div>
            </Link>

            {isInLists.length > 0 && listCount > 0 && (
                <div className="absolute left-2 top-2">
                    <Badge variant="secondary" className="bg-black/70 text-xs text-white hover:bg-black/70">
                        {listCount} {listCount === 1 ? "liste" : "lister"}
                    </Badge>
                </div>
            )}

            <div className="absolute right-2 top-2">
                <MediaListPicker media={media} />
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-2">
                <div className="flex items-end justify-between">
                    <div className="flex-1">
                        {hasOthersWatched && (
                            <div className="mb-1">
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Badge
                                            variant="secondary"
                                            className="cursor-pointer text-xs hover:bg-secondary/80"
                                        >
                                            Sett av {othersWhoWatched.length}{" "}
                                            {othersWhoWatched.length === 1 ? "annen" : "andre"}
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
                                                    <span className="ml-2 text-muted-foreground">
                                                        {new Date(watcher.watched_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        )}
                        {showAddedBy && (
                            <p className="w-fit rounded-md bg-black/60 px-2 py-1 text-xs text-white">
                                Lagt til av {showAddedBy}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
