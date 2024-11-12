"use client";

import { addToWatchlist, checkWatchlistStatus, removeFromWatchlist } from "@/app/actions/watchlist";
import { toast } from "@/hooks/use-toast";
import { Movie } from "@/lib/typings";
import { cn } from "@/lib/utils";
import { Check, Loader2, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

type MovieItemProps = {
	title?: string;
	movies: Movie[];
	isVertical?: boolean;
};

export default function MovieList({ title, movies, isVertical }: MovieItemProps) {
	const [watchlistStatuses, setWatchlistStatuses] = useState<Record<number, boolean>>({});
	const [loadingStatuses, setLoadingStatuses] = useState<Record<number, boolean>>(movies.reduce((acc, movie) => ({ ...acc, [movie.id]: true }), {}));

	useEffect(() => {
		// Fetch each movie's watchlist status only on initial load
		movies.forEach((movie) => {
			checkWatchlistStatus(movie.id.toString())
				.then((status) => {
					setWatchlistStatuses((prev) => ({ ...prev, [movie.id]: status }));
				})
				.catch((error) => {
					console.error(`Error checking status for movie ${movie.id}:`, error);
				})
				.finally(() => {
					setLoadingStatuses((prev) => ({ ...prev, [movie.id]: false }));
				});
		});
	}, [movies]);

	const handleWatchlistToggle = async (movieId: number, movieTitle: string, posterPath: string) => {
		setLoadingStatuses((prev) => ({ ...prev, [movieId]: true }));
		const isInWatchlist = watchlistStatuses[movieId];

		try {
			if (isInWatchlist) {
				await removeFromWatchlist({ user_id: "Henrik", movie_id: movieId.toString() });
				setWatchlistStatuses((prev) => ({ ...prev, [movieId]: false }));
				toast({
					title: "Fjernet fra listen din",
					description: `${movieTitle} har blitt fjernet fra din liste.`,
					variant: "default",
					className: "bg-orange-800",
				});
			} else {
				await addToWatchlist({ user_id: "Henrik", movie_id: movieId.toString(), title: movieTitle, poster_path: posterPath });
				setWatchlistStatuses((prev) => ({ ...prev, [movieId]: true }));
				toast({
					title: "Lagt til i listen din",
					description: `${movieTitle} har blitt lagt til i din liste.`,
					variant: "default",
					className: "bg-green-950",
				});
			}
		} catch (error) {
			console.error("Error updating watchlist:", error);
			// Rollback the status in case of an error
			setWatchlistStatuses((prev) => ({ ...prev, [movieId]: isInWatchlist }));
			toast({ title: "Error", description: "Could not update watchlist. Try again." });
		} finally {
			setLoadingStatuses((prev) => ({ ...prev, [movieId]: false }));
		}
	};

	return (
		<div className="mx-auto max-w-[1400px]">
			{title && <h2 className="text-4xl font-semibold w-full mb-6 mt-0 sm:mt-12 lg:mt-20 font-heading">{title}</h2>}
			<div className={cn("gap-8 grid lg:grid-cols-2", isVertical && "grid lg:grid-flow-row")}>
				{movies.map((movie) =>
					movie.poster_path ? (
						<Link href={`/movie/${movie.id}`} key={movie.id}>
							<Card className="relative sm:flex hover:scale-[99%] transition-all min-w-20 h-full">
								<Button
									className={`absolute top-4 right-4 ${watchlistStatuses[movie.id] ? "bg-green-800 hover:bg-green-900" : "bg-slate-950 hover:bg-slate-900"}`}
									onClick={(e) => {
										e.preventDefault();
										handleWatchlistToggle(movie.id, movie.title, movie.poster_path);
									}}
									variant={!watchlistStatuses[movie.id] ? "outline" : "default"}
									disabled={loadingStatuses[movie.id]}
									size="icon"
								>
									{loadingStatuses[movie.id] ? (
										<Loader2 size={20} className="animate-spin" />
									) : watchlistStatuses[movie.id] ? (
										<Check size={20} color="white" />
									) : (
										<Plus size={20} color="white" />
									)}
									<span className="sr-only">{watchlistStatuses[movie.id] ? "Remove from list" : "Add to list"}</span>
								</Button>
								<Image
									className="w-full sm:w-60 h-full max-h-96 rounded-bl-none rounded-tr-xl sm:rounded-bl-xl sm:rounded-tr-none sm:max-h-full sm:max-w-60 lg:max-w-48 rounded-tl-xl object-cover"
									src={`https://image.tmdb.org/t/p/original${movie.poster_path}`}
									width={500}
									height={750}
									alt={movie.title}
								/>
								<CardContent className="p-0 sm:p-4 lg:p-2">
									<CardHeader>
										<CardTitle className="text-2xl sm:text-3xl font-body mb-6 sm:mr-10">
											{movie.title} ({movie.release_date.split("-")[0]})
										</CardTitle>
										<CardDescription className="overflow-hidden max-h-48 text-md">
											{movie.overview.length > 175 ? `${movie.overview.slice(0, 175)}...` : movie.overview}
										</CardDescription>
									</CardHeader>
								</CardContent>
							</Card>
						</Link>
					) : null
				)}
			</div>
		</div>
	);
}
