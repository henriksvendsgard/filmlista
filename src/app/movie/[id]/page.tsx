"use client";

import MovieDetails from "@/components/MovieDetails/MovieDetails";

interface MovieDetailProps {
	params: {
		id: string;
	};
}

export default function MovieDetailPage({ params }: MovieDetailProps) {
	return <MovieDetails params={params} />;
}
