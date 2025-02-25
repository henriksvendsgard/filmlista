import { TMDBTVShow } from "@/types/tvshow";
import Image from "next/image";

interface TVShowDetailsProps {
	tvshow: TMDBTVShow;
}

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
		Kids: "Barn",
		Music: "Musikk",
		Mystery: "Mysterie",
		News: "Nyheter",
		Reality: "Reality",
		Romance: "Romantikk",
		"Science Fiction": "Science Fiction",
		"Sci-Fi & Fantasy": "Sci-Fi & Fantasy",
		Soap: "Såpeopera",
		Talk: "Talkshow",
		"TV Movie": "TV-Film",
		Thriller: "Thriller",
		War: "Krig",
		"War & Politics": "Krig & Politikk",
		Western: "Western",
	};

	return genreTranslations[genre] || genre;
};

export function TVShowDetails({ tvshow }: TVShowDetailsProps) {
	return (
		<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
			<div className="md:col-span-1">
				{tvshow.poster_path ? (
					<Image src={`https://image.tmdb.org/t/p/w500${tvshow.poster_path}`} alt={tvshow.name} width={500} height={750} className="rounded-lg shadow-lg" />
				) : (
					<div className="aspect-[2/3] bg-gray-200 rounded-lg flex items-center justify-center">
						<span className="text-gray-400">No image available</span>
					</div>
				)}
			</div>

			<div className="md:col-span-2">
				<h1 className="text-4xl font-bold mb-2">{tvshow.name}</h1>
				<p className="text-muted-foreground mb-6">
					{tvshow.first_air_date?.split("-")[0]} • {tvshow.number_of_seasons} sesong{tvshow.number_of_seasons !== 1 ? "er" : ""} • {tvshow.number_of_episodes} episode
					{tvshow.number_of_episodes !== 1 ? "r" : ""}
				</p>

				<div className="mb-8">
					<h2 className="text-2xl font-semibold mb-2">Oversikt</h2>
					<p className="text-muted-foreground">{tvshow.overview || "Ingen beskrivelse tilgjengelig."}</p>
				</div>

				<div className="mb-8">
					<h2 className="text-2xl font-semibold mb-4">Sjangere</h2>
					<div className="flex flex-wrap gap-2">
						{tvshow.genres.map((genre) => (
							<span key={genre.id} className="px-3 py-1 rounded-full bg-muted text-sm">
								{translateGenre(genre.name)}
							</span>
						))}
					</div>
				</div>

				<div>
					<h2 className="text-2xl font-semibold mb-4">Sesonger</h2>
					<div className="space-y-4">
						{tvshow.seasons.map((season) => (
							<div key={season.id} className="p-4 border rounded-lg hover:bg-muted transition-colors">
								<h3 className="font-semibold">{season.name}</h3>
								<p className="text-sm text-muted-foreground">
									{season.episode_count} episode{season.episode_count !== 1 ? "r" : ""} • {season.air_date ? new Date(season.air_date).getFullYear() : "Ukjent dato"}
								</p>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
