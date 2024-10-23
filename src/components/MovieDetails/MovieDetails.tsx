"use client";

import { Movie } from "@/lib/typings";
import { BookmarkPlus } from "lucide-react";
import Image from "next/image";
import { Button } from "../ui/button";

type MovieDetailsProps = {
	movie: Movie;
};

export default function MovieDetails({ movie }: MovieDetailsProps) {
	const addMovie = async (movie: { title: string; poster_path: string }) => {
		const res = await fetch("/api/addMovie", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				title: movie.title,
				poster_path: movie.poster_path,
			}),
		});

		const data = await res.json();
		if (res.ok) {
			console.log("Movie added:", data);
		} else {
			console.error("Error adding movie:", data.error);
		}
	};

	return (
		<>
			<div className="flex flex-col md:flex-row gap-10 max-w-3xl w-full mt-16 px-5 lg:px-10">
				<Image className="md:max-w-[350px] rounded-lg" src={`https://image.tmdb.org/t/p/original${movie.poster_path}`} width={1920} height={1080} alt="Movie poster" />
				<div className="flex flex-col gap-4">
					<h1 className="text-4xl">{movie.title}</h1>
					<div className="text-slate-600 dark:text-slate-400 flex flex-col gap-2">
						<div>
							<span>{movie.genres.map((genre: any) => genre.name).join(", ")}</span>
						</div>
						<div>
							<span>{new Date(movie.release_date).toLocaleDateString("en-GB")}</span>
							<span className="mx-2">•</span>
							<span>{movie.runtime} min</span>
							<span className="mx-2">•</span>
							<span>{movie.vote_average}</span>
						</div>
					</div>
					<p>{movie.overview}</p>
					<div className="mt-4 flex gap-4">
						<a href={`https://www.themoviedb.org/movie/${movie.id}`} target="_blank" rel="noreferrer">
							<Button className="px-4 py-2 rounded-md bg-blue-500 hover:bg-blue-400 text-white">Se på TMDB</Button>
						</a>

						{/* Add movie to watchlist */}
						<Button onClick={() => addMovie(movie)} className="bg-green-800 hover:bg-green-900" variant={"outline"} size={"icon"}>
							<BookmarkPlus size={20} />
						</Button>
					</div>
				</div>
			</div>
		</>
	);
}
