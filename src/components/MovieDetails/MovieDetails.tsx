"use client";

import { addToWatchlist, checkWatchlistStatus, removeFromWatchlist } from "@/app/actions/watchlist";
import { toast } from "@/hooks/use-toast";
import { Movie } from "@/lib/typings";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { User } from "@supabase/supabase-js";
import { Check, InfoIcon, Loader2, Plus, StarIcon } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";

type MovieDetailsProps = {
	movie: Movie;
};

export default function MovieDetails({ movie }: MovieDetailsProps) {
	const [isInWatchlist, setIsInWatchlist] = useState(false);
	const [addedByUser, setAddedByUser] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const [user, setUser] = useState<User | null>(null);
	const supabase = createClientComponentClient();

	useEffect(() => {
		const fetchUser = async () => {
			const { data } = await supabase.auth.getUser();
			setUser(data.user?.email ? data.user : null);
		};

		fetchUser();
	}, [supabase.auth]);

	const userEmail = user?.email as string;
	console.log(userEmail);

	useEffect(() => {
		const fetchWatchlistStatus = async () => {
			setIsLoading(true);
			try {
				const status = await checkWatchlistStatus(movie.id.toString());
				setIsInWatchlist(status.isInWatchlist);
				setAddedByUser(status.addedByUser);
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

	const handleWatchlistToggle = async () => {
		setIsLoading(true);
		try {
			if (isInWatchlist) {
				if (addedByUser === userEmail) {
					// Proceed to remove only if the user added the movie
					await removeFromWatchlist({
						user_id: userEmail,
						movie_id: movie.id.toString(),
					});
					setIsInWatchlist(false);
					toast({
						title: "Fjernet fra listen din",
						description: `${movie.title} har blitt fjernet fra lista.`,
						variant: "default",
						className: "bg-orange-800",
					});
				} else {
					toast({
						title: "Advarsel",
						description: "Du kan bare fjerne filmer som du har lagt til selv.",
						variant: "destructive",
					});
				}
			} else {
				await addToWatchlist({
					user_id: userEmail,
					movie_id: movie.id.toString(),
					title: movie.title,
					poster_path: movie.poster_path,
				});
				setIsInWatchlist(true);
				toast({
					title: "Lagt til i listen din",
					description: `${movie.title} har blitt lagt til i lista.`,
					variant: "default",
					className: "bg-green-950",
				});
			}
		} catch (error) {
			console.error("Error updating watchlist:", error);
			toast({
				title: "Feil",
				description: "Klarte ikke oppdatere lista. Prøv igjen",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex flex-col md:flex-row gap-10 max-w-6xl w-full mt-0 sm:mt-12 mb-32 px-5 lg:px-10">
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
						<Button className="px-4 py-2 rounded-md bg-blue-500 hover:bg-blue-400 text-white">
							<InfoIcon size={16} className="mr-1" />
							<span>Les mer på TMDb</span>
						</Button>
					</a>
					<Button
						onClick={handleWatchlistToggle}
						disabled={isLoading}
						variant={!isInWatchlist ? "outline" : "default"}
						className={isInWatchlist ? "bg-green-800 hover:bg-green-900" : "bg-slate-950 hover:bg-slate-900"}
						size="icon"
					>
						{isLoading ? <Loader2 size={20} className="animate-spin" /> : isInWatchlist ? <Check size={20} color="white" /> : <Plus size={20} color="white" />}

						<span className="sr-only">{isInWatchlist ? "Fjern fra liste" : "Legg til i liste"}</span>
					</Button>
				</div>
				{isInWatchlist && <p className="text-sm text-gray-500">Lagt til av {addedByUser}</p>}
			</div>
		</div>
	);
}
