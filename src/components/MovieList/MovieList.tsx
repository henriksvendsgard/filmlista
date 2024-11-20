"use client";

import { Button } from "@/components/ui/button";
import { TMDBMovie } from "@/types/movie";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { MovieCard } from "../MovieCard/MovieCard";
import { MovieGridSkeleton } from "./MovieCardSkeleton";

interface MovieListProps {
	movies: {
		results: TMDBMovie[];
		total_pages: number;
		page: number;
		total_results: number;
	};
	title: string;
	isOnFrontPage?: boolean;
}

export default function MovieList({ movies, title, isOnFrontPage }: MovieListProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [isLoading, setIsLoading] = useState(false);

	// Loading state
	useEffect(() => {
		setIsLoading(false);
	}, [movies]);

	const createPageURL = (pageNumber: number) => {
		const params = new URLSearchParams(searchParams);
		params.set("page", pageNumber.toString());
		return `${pathname}?${params.toString()}`;
	};

	const paginate = (pageNumber: number) => {
		setIsLoading(true);
		router.push(createPageURL(pageNumber));
		document.querySelector(".movie-list")?.scrollIntoView({ behavior: "smooth" });
	};

	// List ut 500 sider maks
	const maxPages = Math.min(movies.total_pages, 500);
	const currentPage = movies.page;

	return (
		<section className="movie-list w-full h-full max-w-full">
			<h2 className="text-3xl font-bold tracking-tight mb-6">{title}</h2>

			<div className="w-full max-w-full">
				{isLoading ? (
					<MovieGridSkeleton />
				) : (
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
						{movies.results.map((movie) => (
							<MovieCard
								key={movie.id}
								movie={{
									id: movie.id.toString(),
									movie_id: movie.id.toString(),
									title: movie.title,
									poster_path: movie.poster_path || "",
									watched: false,
									added_at: undefined,
									added_by: undefined,
									added_by_email: undefined,
								}}
								isInList={false}
								lists={{ owned: [], shared: [] }}
								movieLists={[]}
								onAddToList={() => {}}
								onRemoveFromList={() => {}}
								onToggleWatched={() => {}}
								onClick={() => router.push(`/movie/${movie.id}`)}
								currentListId={undefined}
								isWatchList={false}
								showAddedBy={false}
							/>
						))}
					</div>
				)}
			</div>

			{isOnFrontPage && maxPages > 1 && (
				<div className="flex justify-center items-center gap-2 mt-8 mb-12">
					<Button variant="outline" onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1 || isLoading} className="h-10">
						<ChevronLeft className="h-4 w-4 sm:mr-2" />
						<span className="hidden sm:inline">Forrige</span>
					</Button>

					<div className="flex items-center gap-2">
						<span className="text-sm">
							Side {currentPage} av {maxPages}
						</span>
					</div>

					<Button variant="outline" onClick={() => paginate(currentPage + 1)} disabled={currentPage === maxPages || isLoading} className="h-10">
						<span className="hidden sm:inline">Neste</span>
						<ChevronRight className="h-4 w-4 sm:ml-2" />
					</Button>
				</div>
			)}
		</section>
	);
}
