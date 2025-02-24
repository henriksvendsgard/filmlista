"use client";

import MovieList from "@/components/MovieList/MovieList";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { getDiscoverMovies, getMovieGenres, getPopularMovies } from "@/lib/getMovies";
import { ChevronDown } from "lucide-react";
import { X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

export default function Home() {
	const [movies, setMovies] = useState<any>(null);
	const [genres, setGenres] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const searchParams = useSearchParams();
	const router = useRouter();

	const currentParams = useMemo(() => {
		const page = Number(searchParams.get("page")) || 1;
		const selectedGenres = searchParams.get("genres")?.split(",").filter(Boolean) || [];
		return { page, selectedGenres };
	}, [searchParams]);

	const updateUrl = useCallback(
		(newGenres: string[]) => {
			const params = new URLSearchParams();
			if (newGenres.length > 0) {
				params.set("genres", newGenres.join(","));
			}
			params.set("page", "1");
			router.push(`/?${params.toString()}`);
		},
		[router]
	);

	const fetchMovies = useCallback(async () => {
		setIsLoading(true);
		try {
			let movieData;
			if (currentParams.selectedGenres.length === 0) {
				movieData = await getPopularMovies(currentParams.page);
			} else {
				movieData = await getDiscoverMovies(currentParams.selectedGenres.join(","), undefined, currentParams.page);
			}
			setMovies(movieData);
		} catch (error) {
			console.error("Error fetching movies:", error);
		}
		setIsLoading(false);
	}, [currentParams]);

	const fetchGenres = useCallback(async () => {
		try {
			const genreData = await getMovieGenres();
			setGenres(genreData);
		} catch (error) {
			console.error("Error fetching genres:", error);
		}
	}, []);

	useEffect(() => {
		fetchGenres();
	}, [fetchGenres]);

	useEffect(() => {
		fetchMovies();
	}, [fetchMovies]);

	const handleGenreChange = useCallback(
		(genreId: string, checked: boolean | "indeterminate") => {
			const newGenres = checked === true ? [...currentParams.selectedGenres, genreId] : currentParams.selectedGenres.filter((id) => id !== genreId);
			updateUrl(newGenres);
		},
		[currentParams.selectedGenres, updateUrl]
	);

	const handleRemoveGenre = useCallback(
		(genreId: string) => {
			const newGenres = currentParams.selectedGenres.filter((id) => id !== genreId);
			updateUrl(newGenres);
		},
		[currentParams.selectedGenres, updateUrl]
	);

	const handleClearGenres = useCallback(() => {
		updateUrl([]);
	}, [updateUrl]);

	const translateGenre = (genre: string): string => {
		const genreTranslations: { [key: string]: string } = {
			Action: "Action",
			Adventure: "Eventyr",
			Animation: "Animasjon",
			Comedy: "Komedie",
			Crime: "Krim",
			Documentary: "Dokumentar",
			Drama: "Drama",
			Family: "Familie",
			Fantasy: "Fantasy",
			History: "Historie",
			Horror: "Skrekk",
			Music: "Musikk",
			Mystery: "Mysterie",
			Romance: "Romantikk",
			"Science Fiction": "Science Fiction",
			"TV Movie": "TV-Film",
			Thriller: "Thriller",
			War: "Krig",
			Western: "Western",
		};

		return genreTranslations[genre] || genre;
	};

	return (
		<div className="px-5 lg:px-10 mb-20">
			<div className="flex flex-col gap-6 mb-8">
				<h1 className="text-4xl font-bold">Utforsk filmer</h1>
				<div className="space-y-4">
					<DropdownMenu>
						<div className="flex flex-row gap-2">
							<DropdownMenuTrigger asChild>
								<Button variant="outline" className="w-[200px] justify-between">
									<span className="truncate">{currentParams.selectedGenres.length === 0 ? "Velg sjangere" : `${currentParams.selectedGenres.length} valgt`}</span>
									<ChevronDown className="h-4 w-4 opacity-50" />
								</Button>
							</DropdownMenuTrigger>
						</div>
						<DropdownMenuContent className="w-[400px] p-4">
							<div className="grid grid-cols-2 gap-4">
								{genres.map((genre) => (
									<div key={genre.id} className="flex items-center space-x-2">
										<Checkbox
											id={`genre-${genre.id}`}
											checked={currentParams.selectedGenres.includes(genre.id.toString())}
											onCheckedChange={(checked) => handleGenreChange(genre.id.toString(), checked === true)}
										/>
										<Label htmlFor={`genre-${genre.id}`}>{translateGenre(genre.name)}</Label>
									</div>
								))}
							</div>
						</DropdownMenuContent>
					</DropdownMenu>

					{currentParams.selectedGenres.length > 0 && (
						<div className="space-y-4">
							<div className="flex flex-row gap-2 max-w-[400px]">
								{currentParams.selectedGenres.map((genreId) => {
									const genre = genres.find((g) => g.id.toString() === genreId);
									if (!genre) return null;
									return (
										<Badge key={genreId} variant="secondary" className="pl-3 pr-2 py-1.5">
											{translateGenre(genre.name)}
											<button onClick={() => handleRemoveGenre(genreId)} className="ml-1 hover:text-secondary-foreground">
												<X className="w-4 h-4" />
											</button>
										</Badge>
									);
								})}
							</div>
						</div>
					)}
				</div>
			</div>

			<MovieList
				title={currentParams.selectedGenres.length === 0 ? "Populære filmer" : `Filmer i valgte sjangere`}
				movies={movies || { results: [], total_pages: 0, page: 1, total_results: 0 }}
				isOnFrontPage
				isLoading={isLoading}
			/>
		</div>
	);
}
