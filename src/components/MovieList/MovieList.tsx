import { Movie } from "@/lib/typings";
import { cn } from "@/lib/utils";
import Link from "next/link";
import DynamicImage from "../DynamicImage/DynamicImage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

type MovieItemProps = {
	title?: string;
	movies: Movie[];
	isVertical?: boolean;
};

function MovieList({ title, movies, isVertical }: MovieItemProps) {
	return (
		<>
			<div className="mx-auto max-w-[1400px]">
				{title && <h2 className="text-4xl font-semibold w-full mb-6 mt-20 font-heading">{title}</h2>}
				<div className={cn("gap-8 grid lg:grid-cols-2", isVertical && "grid lg:grid-flow-row ")}>
					{movies.map(
						(movie) =>
							movie.poster_path && (
								<Link href={`/movie/${movie.id}`} key={movie.id}>
									<Card className="sm:flex hover:scale-[99%] transition-all min-w-20 h-full">
										<DynamicImage
											imageClass="w-full sm:w-60 h-full max-h-96 rounded-bl-none rounded-tr-xl sm:rounded-bl-xl sm:rounded-tr-none sm:max-h-full sm:max-w-60 lg:max-w-48 rounded-tl-xl object-cover"
											url={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
											alt={movie.title}
											containerClass="object-cover"
										/>
										<CardContent className="p-0 sm:p-4 lg:p-2">
											<CardHeader>
												<CardTitle className="text-2xl sm:text-3xl font-body mb-6">
													{movie.title} ({movie.release_date.split("-")[0]})
												</CardTitle>
												<CardDescription className="overflow-hidden max-h-48 text-md">
													{movie.overview.length > 175 ? `${movie.overview.slice(0, 175)}...` : movie.overview}
												</CardDescription>
											</CardHeader>
										</CardContent>
									</Card>
								</Link>
							)
					)}
				</div>
			</div>
		</>
	);
}

export default MovieList;
