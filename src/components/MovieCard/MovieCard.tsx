import { useSupabase } from "@/components/SupabaseProvider";
import { MediaListPicker } from "@/components/MediaListPicker/MediaListPicker";
import { MediaRef } from "@/contexts/ListActionsContext";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { List } from "@/lib/listRepository";
import { Check, Ellipsis } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface Movie {
    id: string;
    movie_id: string;
    title: string;
    poster_path: string;
    added_at: string;
    added_by: string;
    added_by_displayname?: string;
    release_date?: string;
    watched_by: {
        user_id: string;
        displayname: string;
        watched_at: string;
    }[];
    is_watched_by_me: boolean;
}

interface MovieCardProps {
    movie: Movie;
    media?: MediaRef;
    isInList: boolean;
    listCount?: number;
    lists?: {
        owned: List[];
        shared: List[];
    };
    movieLists?: string[];
    onRemoveFromList?: (listId: string) => void;
    onToggleWatched?: (currentWatchedStatus: boolean) => void;
    onClick?: () => void;
    href?: string;
    currentListId?: string;
    isWatchList?: boolean;
    showAddedBy?: boolean;
}

export function MovieCard({
    movie,
    media,
    isInList,
    listCount = 0,
    onRemoveFromList,
    onToggleWatched,
    onClick,
    href,
    currentListId,
    isWatchList = false,
    showAddedBy = false,
}: MovieCardProps) {
    const { user } = useSupabase();

    const othersWhoWatched = movie.watched_by?.filter((w) => w.user_id !== user?.id) || [];
    const hasOthersWatched = othersWhoWatched.length > 0;

    const mediaRef: MediaRef =
        media ??
        ({
            mediaId: movie.movie_id,
            mediaType: "movie",
            title: movie.title,
            posterPath: movie.poster_path || null,
            releaseDate: movie.release_date,
        } as MediaRef);

    return (
        <div className="group relative">
            {href ? (
                <Link
                    href={href}
                    className={`relative block aspect-2/3 overflow-hidden rounded-lg bg-muted/50 transition-all duration-300 ${movie.is_watched_by_me ? "opacity-50" : ""}`}
                >
                    <Image
                        src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                        alt={movie.title}
                        width={500}
                        height={750}
                        className="h-full w-full object-cover transition-all sm:group-hover:scale-105"
                    />
                </Link>
            ) : (
                <div
                    className={`relative aspect-2/3 cursor-pointer overflow-hidden rounded-lg bg-muted/50 transition-all duration-300 ${movie.is_watched_by_me ? "opacity-50" : ""}`}
                    onClick={onClick}
                >
                    <Image
                        src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                        alt={movie.title}
                        width={500}
                        height={750}
                        className="h-full w-full cursor-pointer object-cover transition-all sm:hover:scale-105"
                    />
                </div>
            )}

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
                                    <DialogContent className="max-w-sm rounded-lg">
                                        <DialogHeader>
                                            <DialogTitle className="mb-2">Sett av</DialogTitle>
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
                                Lagt til av {movie.added_by_displayname}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {isWatchList && movie.is_watched_by_me && (
                <div className="absolute left-2 top-2 rounded-full bg-green-700 p-2 text-white">
                    <Check className="h-4 w-4" />
                </div>
            )}

            {isInList && !isWatchList && listCount > 0 && (
                <div className="absolute left-2 top-2">
                    <Badge variant="secondary" className="bg-black/70 text-xs text-white hover:bg-black/70">
                        {listCount} {listCount === 1 ? "liste" : "lister"}
                    </Badge>
                </div>
            )}

            <div className="absolute right-2 top-2">
                {isWatchList ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="rounded-full">
                                <Ellipsis className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            {onToggleWatched && (
                                <DropdownMenuItem onClick={() => onToggleWatched(movie.is_watched_by_me)}>
                                    {movie.is_watched_by_me ? "Marker som usett" : "Marker som sett"}
                                </DropdownMenuItem>
                            )}
                            {currentListId && onRemoveFromList && (
                                <>
                                    <DropdownMenuSeparator />
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <DropdownMenuItem
                                                className="text-red-600"
                                                onSelect={(e) => e.preventDefault()}
                                            >
                                                Fjern fra listen
                                            </DropdownMenuItem>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="rounded">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Er du sikker?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Dette vil fjerne {movie.title} fra listen.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel className="rounded-full">Avbryt</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => onRemoveFromList(currentListId)}
                                                    className="rounded-full bg-red-600 text-white hover:bg-red-700"
                                                >
                                                    Fjern
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <MediaListPicker media={mediaRef} />
                )}
            </div>
        </div>
    );
}
