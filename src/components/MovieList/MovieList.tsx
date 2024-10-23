import { cn } from "@/lib/utils";
import { Movie } from "@/lib/typings";
import Image from "next/image";
import Link from "next/link";
import { Button } from "../ui/button";
import DynamicImage from "../DynamicImage/DynamicImage";

type MovieItemProps = {
	title?: string;
	movies: Movie[];
	isVertical?: boolean;
};

function MovieList({ title, movies, isVertical }: MovieItemProps) {
	return (
		<>
			<div className="mx-auto w-full">
				{title && <h2 className="text-3xl  w-full mb-10 mt-20 font-heading">{title}</h2>}
				<div className={cn("gap-10 flex flex-row overflow-y-hidden overflow-x-scroll p-2", isVertical && "flex-col overflow-x-hidden")}>
					{movies.map(
						(movie) =>
							movie.poster_path && (
								<Link href={`/movie/${movie.id}`} key={movie.id}>
									<div
										className={cn(
											"flex group hover:scale-105 transition ease-out cursor-pointer h-56 min-w-96 rounded-lg relative",
											isVertical && "w-full mx-auto min-w-0 h-[unset] hover:scale-[101%]"
										)}
									>
										<div className={cn("flex flex-col", isVertical && "lg:flex-row gap-10 w-full lg:w-fit")}>
											<div
												className={cn(
													"absolute bg-gradient-to-t group-hover:from-slate-950 from-indigo-950/20 rounded-lg l w-full h-full top-0 right-0 left-0 bottom-0 z-10",
													isVertical && "hidden"
												)}
											></div>
											<DynamicImage
												url={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
												alt={movie.title}
												containerClass={cn(
													"rounded-lg w-full h-full object-cover top-0 right-0 left-0 bottom-0",
													isVertical && "relative flex w-full max-w-xl h-72 lg:h-56 lg:min-w-96 lg:max-w-96 mx-auto"
												)}
												imageClass={cn("rounded-lg w-full h-full object-cover top-0 right-0 left-0 bottom-0")}
											/>
											<div
												className={cn(
													"flex flex-col justify-end z-20 h-full",
													isVertical && "justify-center text-center mb-10 lg:mb-5 lg:text-left max-w-xl mx-auto lg:max-w-full"
												)}
											>
												<div className="flex justify-between">
													<h3 className={cn("text-l font-heading", isVertical && "text-xl")}>
														{movie.title} ({movie.release_date.split("-")[0]})
													</h3>
													<Button className="text-xl p-2" variant={"outline"}>
														+
													</Button>
												</div>
												<p className={cn("text-xs", isVertical && "hidden lg:block")}>Noe kommer her</p>
												<p className={cn("hidden group-hover:block text-s mt-2", isVertical && "block max-w-2xl")}>{movie.overview}</p>
											</div>
										</div>
									</div>
								</Link>
							)
					)}
				</div>
			</div>
		</>
	);
}

export default MovieList;
