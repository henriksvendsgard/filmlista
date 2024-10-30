"use client";

import { toggleWatchedStatus } from "@/app/actions/watchlist";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { Eye, EyeOff, Loader2Icon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";

interface WatchListProps {
	title: string;
}

interface Movie {
	id: number;
	created_at: string;
	user_id: string;
	title: string;
	movie_id: number;
	poster_path: string;
	watched: boolean;
}

export default function WatchList({ title }: WatchListProps) {
	const [isLoading, setIsLoading] = useState(true);
	const [watchlistMovies, setWatchlistMovies] = useState<Movie[]>([]);
	const [pendingMovies, setPendingMovies] = useState<Set<number>>(new Set());

	const sortMovies = (movies: Movie[]) => {
		return movies.sort((watched, unwatched) => {
			if (watched.watched && !unwatched.watched) {
				return 1;
			}
			if (!watched.watched && unwatched.watched) {
				return -1;
			}
			return new Date(unwatched.created_at).getTime() - new Date(watched.created_at).getTime();
		});
	};

	useEffect(() => {
		const fetchWatchlistMovies = async () => {
			setIsLoading(true);
			try {
				const { data, error } = await supabase.from("Watchlist").select("*");

				if (error) {
					console.error("Klarte ikke hente watchlist fra database:", error);
					return;
				}

				setWatchlistMovies(sortMovies(data));
			} catch (error) {
				console.error("Noe feil skjedde:", error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchWatchlistMovies();
	}, []);

	const handleToggleWatched = async (movieId: number, movieTitle: string, event: React.MouseEvent) => {
		event.preventDefault();
		setPendingMovies((prev) => new Set(prev).add(movieId));
		try {
			const result = await toggleWatchedStatus(movieId);
			if (result.success && typeof result.watched === "boolean") {
				setWatchlistMovies((movies) => {
					const updatedMovies = movies.map((movie) => (movie.movie_id === movieId ? { ...movie, watched: result.watched || false } : movie));
					return sortMovies(updatedMovies);
				});
				toast({
					title: result.watched ? `${movieTitle} er markert som sett` : `${movieTitle} er markert som ikke sett`,
					description: `Du har ${result.watched ? "sett" : "ikke sett"} denne filmen.`,
					variant: "default",
					className: result.watched ? "bg-blue-950" : "bg-yellow-900",
				});
			} else {
				throw new Error("Failed to update watched status");
			}
		} catch (error) {
			console.error("Error updating watched status:", error);
			toast({
				title: "Error",
				description: "Failed to update watched status. Please try again.",
				variant: "destructive",
			});
		} finally {
			setPendingMovies((prev) => {
				const newSet = new Set(prev);
				newSet.delete(movieId);
				return newSet;
			});
		}
	};

	return (
		<div>
			<div className="flex items-center mb-6 mt-12">
				<h1 className="text-5xl font-bold font-heading">{title}</h1>
			</div>
			{isLoading && (
				<div className="flex align-middle justify-center my-60 ">
					<Loader2Icon className="animate-spin w-20 h-20 text-gray-600 max-w-full" />
				</div>
			)}
			{watchlistMovies.length === 0 && !isLoading ? (
				<div>
					<p className="text-lg text-gray-600">Ingen filmer lagt til i listen enda...</p>
				</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
					{watchlistMovies.map((movie: Movie) => (
						<Link href={`/movie/${movie.movie_id}`} key={movie.id} className="hover:scale-[99%] transition-all">
							<Card key={movie.id} className="overflow-hidden">
								<div className="relative h-[400px] xl:h-[500px] z-0 object-cover">
									<Button
										onClick={(e) => handleToggleWatched(movie.movie_id, movie.title, e)}
										size={"icon"}
										variant={"outline"}
										className="absolute top-4 right-4 z-10"
										disabled={pendingMovies.has(movie.movie_id)}
									>
										{pendingMovies.has(movie.movie_id) ? <Loader2Icon className="animate-spin" /> : movie.watched ? <EyeOff className="text-gray-500" /> : <Eye />}
									</Button>
									<Image
										width={500}
										height={500}
										className={`object-cover h-[400px] xl:h-[500px] w-full` + (movie.watched ? "filer brightness-[40%]" : "")}
										src={`https://image.tmdb.org/t/p/original${movie.poster_path}`}
										alt={movie.title}
									/>
								</div>
								<CardContent className="p-4 z-10">
									<h2 className="text-2xl font-semibold truncate">{movie.title}</h2>
									<p className="text-gray-600 text-sm mt-1">Lagt til {new Date(movie.created_at).toLocaleDateString("nb-NO")}</p>
									{/* TODO: Kommer snart: */}
									{/* <p className="text-gray-400 text-sm mt-1">Av {movie.user_id}</p> */}
								</CardContent>
							</Card>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
