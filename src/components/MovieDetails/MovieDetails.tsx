"use client";

import { addToWatchlist, checkWatchlistStatus, removeFromWatchlist } from "@/app/actions/watchlist";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Movie } from "@/lib/typings";
import { BookmarkMinus, BookmarkPlus, Loader2, StarIcon } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

type MovieDetailsProps = {
	movie: Movie;
};

function SubmitButton({ isInWatchlist, isLoading }: { isInWatchlist: boolean; isLoading: boolean }) {
	const { pending } = useFormStatus();

	if (isLoading) {
		return (
			<Button type="button" className="bg-gray-400" variant="outline" size="icon" disabled>
				<Loader2 size={20} className="animate-spin" />
			</Button>
		);
	}
	return (
		<Button
			type="submit"
			aria-label={isInWatchlist ? "Fjern fra Watchlist" : "Legg til i Watchlist"}
			title={isInWatchlist ? "Fjern fra Watchlist" : "Legg til i Watchlist"}
			className={isInWatchlist ? "bg-red-800 hover:bg-red-900" : "bg-green-800 hover:bg-green-900"}
			variant="outline"
			size="icon"
			disabled={pending}
		>
			{isInWatchlist ? <BookmarkMinus size={20} color="white" /> : <BookmarkPlus size={20} color="white" />}
		</Button>
	);
}

export default function MovieDetails({ movie }: MovieDetailsProps) {
	const [isInWatchlist, setIsInWatchlist] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchWatchlistStatus = async () => {
			setIsLoading(true);
			try {
				const status = await checkWatchlistStatus(movie.id.toString());
				setIsInWatchlist(status);
			} catch (error) {
				console.error("Error checking watchlist status:", error);
				toast({
					title: "Error",
					description: "Failed to check watchlist status. Please try again.",
					variant: "destructive",
				});
			} finally {
				setIsLoading(false);
			}
		};

		fetchWatchlistStatus();
	}, [movie.id]);

	const handleFormAction = async (formData: FormData) => {
		const action = formData.get("action") as string;
		setIsLoading(true);
		try {
			if (action === "add") {
				await addToWatchlist(formData);
				setIsInWatchlist(true);
				toast({
					title: "Lagt til i Watchlist",
					description: `${movie.title} har blitt lagt til i din liste.`,
					variant: "default",
				});
			} else if (action === "remove") {
				await removeFromWatchlist(formData);
				setIsInWatchlist(false);
				toast({
					title: "Fjernet fra Watchlist",
					description: `${movie.title} har blitt fjernet fra din liste.`,
					variant: "destructive",
				});
			}
		} catch (error) {
			console.error("Error updating watchlist:", error);
			toast({
				title: "Error",
				description: "Failed to update watchlist. Please try again.",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex flex-col md:flex-row gap-10 max-w-6xl w-full mt-16 px-5 lg:px-10">
			<div className="md:max-w-[450px]">
				<Image className="md:max-w-[450px] rounded-lg" src={`https://image.tmdb.org/t/p/original${movie.poster_path}`} width={450} height={500} alt={`Movie poster for ${movie.title}`} />
			</div>
			<div className="flex flex-col gap-4">
				<h1 className="text-4xl font-bold">{movie.title}</h1>
				<div className="text-slate-600 dark:text-slate-400 flex flex-col gap-2">
					<div>
						<span>{movie.genres.map((genre: any) => genre.name).join(", ")}</span>
					</div>
					<div className="flex">
						<span>{new Date(movie.release_date).toLocaleDateString("en-GB")}</span>
						<span className="mx-2">•</span>
						<span>{movie.runtime} min</span>
						<span className="mx-2">•</span>
						<span className="flex items-center gap-1">
							{movie.vote_average.toFixed(1)} / 10
							<StarIcon size={14} fill="currentColor" />
						</span>
					</div>
				</div>
				<p className="text-lg">{movie.overview}</p>
				<div className="mt-4 flex gap-4">
					<a href={`https://www.themoviedb.org/movie/${movie.id}`} target="_blank" rel="noreferrer">
						<Button className="px-4 py-2 rounded-md bg-blue-500 hover:bg-blue-400 text-white">View on TMDB</Button>
					</a>
					<form action={handleFormAction}>
						<input type="hidden" name="user_id" value="Henrik" />
						<input type="hidden" name="movie_id" value={movie.id.toString()} />
						<input type="hidden" name="title" value={movie.title} />
						<input type="hidden" name="poster_path" value={movie.poster_path} />
						<input type="hidden" name="action" value={isInWatchlist ? "remove" : "add"} />
						<SubmitButton isInWatchlist={isInWatchlist} isLoading={isLoading} />
					</form>
				</div>
			</div>
		</div>
	);
}
