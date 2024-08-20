import { Movie, SearchResults } from "@/lib/typings";

type MovieDetailsProps = {
    movie: Movie;
};


export default function MovieDetails( { movie }: MovieDetailsProps ) {
  console.log(movie)
  return (
    <div>Movie Details component {movie.title}</div>
  )
}
