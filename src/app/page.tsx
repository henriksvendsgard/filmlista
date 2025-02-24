"use client";

import MovieList from "@/components/MovieList/MovieList";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getDiscoverMovies, getMovieGenres, getPopularMovies } from "@/lib/getMovies";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function Home() {
	const [movies, setMovies] = useState<any>(null);
	const [genres, setGenres] = useState<any[]>([]);
	const [selectedGenre, setSelectedGenre] = useState<string>("popular");
	const [isLoading, setIsLoading] = useState(true);
	const searchParams = useSearchParams();
	const router = useRouter();
	const page = Number(searchParams.get("page")) || 1;

	const fetchMovies = useCallback(async () => {
		setIsLoading(true);
		try {
			let movieData;
			if (selectedGenre === "popular") {
				movieData = await getPopularMovies(page);
			} else {
				movieData = await getDiscoverMovies(selectedGenre, undefined, page);
			}
			setMovies(movieData);
		} catch (error) {
			console.error("Error fetching movies:", error);
		}
		setIsLoading(false);
	}, [selectedGenre, page]);

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

	const handleGenreChange = (value: string) => {
		setSelectedGenre(value);
		router.push("/?page=1");
	};

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
				<Select value={selectedGenre} onValueChange={handleGenreChange}>
					<SelectTrigger className="w-[200px]">
						<SelectValue placeholder="Velg kategori" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="popular">Populære filmer</SelectItem>
						{genres.map((genre) => (
							<SelectItem key={genre.id} value={genre.id.toString()}>
								{translateGenre(genre.name)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<MovieList
				title={selectedGenre === "popular" ? "Populære filmer" : `${translateGenre(genres.find((g) => g.id.toString() === selectedGenre)?.name || "")} filmer`}
				movies={movies || { results: [], total_pages: 0, page: 1, total_results: 0 }}
				isOnFrontPage
				isLoading={isLoading}
			/>
		</div>
	);
}
