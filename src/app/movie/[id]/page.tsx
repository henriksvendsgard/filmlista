import MovieDetails from "@/components/MovieDetails/MovieDetails";
import { getMoviePageData } from "@/lib/tmdb/movies";
import { notFound } from "next/navigation";

interface MovieDetailPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function MovieDetailPage({ params }: MovieDetailPageProps) {
    const { id } = await params;

    let data;
    try {
        data = await getMoviePageData(id);
    } catch {
        notFound();
    }

    return <MovieDetails movieId={id} initialData={data} />;
}
