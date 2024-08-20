import { Movie } from "@/lib/typings";
import Image from "next/image";

type MovieDetailsProps = {
	movie: Movie;
};

export default function MovieDetails({ movie }: MovieDetailsProps) {
	return (
		<>
			<div className="flex flex-row gap-10 max-w-3xl w-full mt-16">
				<Image
					src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
					alt={movie.title}
					width={1920}
					height={1080}
					className={"movie-image rounded-lg w-full h-full object-cover top-0 right-0 left-0 bottom-0 max-w-60"}
				/>
				<div className="flex flex-col gap-4">
					<h1 className="text-4xl">{movie.title}</h1>
					<div className="text-slate-600 dark:text-slate-400">
						<div>
							<span>{movie.genres.map((genre) => genre.name).join(", ")}</span>
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
					<div className="flex mt-auto mb-0">
						<a href={`https://www.themoviedb.org/movie/${movie.id}`} target="_blank" rel="noreferrer">
							<button className="px-4 py-2 rounded-md bg-blue-500 hover:bg-blue-400 text-white">Se på TMDB</button>
						</a>
					</div>
				</div>
			</div>
		</>
	);
}
