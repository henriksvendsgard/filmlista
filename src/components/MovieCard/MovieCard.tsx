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
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Check, Ellipsis } from "lucide-react";
import Image from "next/image";

interface List {
	id: string;
	name: string;
	owner_id: string;
}

interface MovieCardProps {
	movie: {
		id: string;
		movie_id: string;
		title: string;
		poster_path: string;
		watched: boolean;
		added_at?: string;
		added_by?: string;
		added_by_email?: string;
	};
	isInList: boolean;
	lists?: {
		owned: List[];
		shared: List[];
	};
	movieLists?: string[];
	onAddToList?: (listId: string) => void;
	onRemoveFromList?: (listId: string) => void;
	onToggleWatched?: () => void;
	onClick: () => void;
	currentListId?: string;
	isWatchList?: boolean;
	showAddedBy?: boolean;
}

export function MovieCard({
	movie,
	isInList,
	lists = { owned: [], shared: [] },
	movieLists = [],
	onAddToList,
	onRemoveFromList,
	onToggleWatched,
	onClick,
	currentListId,
	isWatchList = false,
	showAddedBy = false,
}: MovieCardProps) {
	const availableOwnedLists = lists.owned.filter((list) => !movieLists.includes(list.id));
	const availableSharedLists = lists.shared.filter((list) => !movieLists.includes(list.id));

	return (
		<div className="group relative">
			<div className={`aspect-[2/3] overflow-hidden rounded-lg ${isWatchList && movie.watched ? "opacity-40" : ""}`}>
				<Image
					src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
					alt={movie.title}
					width={500}
					height={750}
					className="object-cover transition-all hover:scale-105 cursor-pointer"
					onClick={onClick}
				/>
			</div>
			{isWatchList && movie.watched && (
				<div className="w-8 h-8 flex items-center absolute top-2 left-2 py-1 px-2 bg-green-700 bg-opacity-70 rounded-[100%] text-xs">
					<Check />
				</div>
			)}
			<div className="absolute top-2 right-2">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" size="icon">
							<Ellipsis className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-56">
						{isWatchList ? (
							<>
								{onToggleWatched && <DropdownMenuItem onClick={onToggleWatched}>{movie.watched ? "Marker som usett" : "Marker som sett"}</DropdownMenuItem>}
								{currentListId && onRemoveFromList && (
									<>
										<DropdownMenuSeparator />
										<AlertDialog>
											<AlertDialogTrigger asChild>
												<DropdownMenuItem className="text-red-600" onSelect={(e) => e.preventDefault()}>
													Fjern fra listen
												</DropdownMenuItem>
											</AlertDialogTrigger>
											<AlertDialogContent>
												<AlertDialogHeader>
													<AlertDialogTitle>Er du sikker?</AlertDialogTitle>
													<AlertDialogDescription>Dette vil fjerne {movie.title} fra listen.</AlertDialogDescription>
												</AlertDialogHeader>
												<AlertDialogFooter>
													<AlertDialogCancel>Avbryt</AlertDialogCancel>
													<AlertDialogAction onClick={() => onRemoveFromList(currentListId)} className="bg-red-600 hover:bg-red-700">
														Fjern
													</AlertDialogAction>
												</AlertDialogFooter>
											</AlertDialogContent>
										</AlertDialog>
									</>
								)}
							</>
						) : (
							<>
								{availableOwnedLists.length > 0 && (
									<>
										<DropdownMenuItem disabled className="text-muted-foreground">
											Dine lister
										</DropdownMenuItem>
										{availableOwnedLists.map((list) => (
											<DropdownMenuItem key={list.id} onClick={() => onAddToList?.(list.id)}>
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
											<DropdownMenuItem key={list.id} onClick={() => onAddToList?.(list.id)}>
												Legg til i {list.name}
											</DropdownMenuItem>
										))}
									</>
								)}

								{isInList && onRemoveFromList && (
									<>
										{(availableOwnedLists.length > 0 || availableSharedLists.length > 0) && <DropdownMenuSeparator />}
										<DropdownMenuItem disabled className="text-muted-foreground">
											Fjern fra listen
										</DropdownMenuItem>
										{[...lists.owned, ...lists.shared]
											.filter((list) => movieLists.includes(list.id))
											.map((list) => (
												<DropdownMenuItem key={list.id} onClick={() => onRemoveFromList(list.id)} className="text-red-600">
													{list.name}
												</DropdownMenuItem>
											))}
									</>
								)}

								{!availableOwnedLists.length && !availableSharedLists.length && !isInList && <DropdownMenuItem disabled>Ingen listen tilgjengelig</DropdownMenuItem>}
							</>
						)}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
			{showAddedBy && movie.added_by && movie.added_by_email && (
				<div className="absolute bottom-2 left-2 bg-background/80 p-2 rounded-md text-xs break-all mr-2">Lagt til av {movie.added_by_email}</div>
			)}
		</div>
	);
}
