import { Skeleton } from "@/components/ui/skeleton";

export function MovieCardSkeleton() {
	return (
		<div className="group relative">
			{/* Poster skeleton with proper sizing */}
			<div className="aspect-[2/3] overflow-hidden rounded-lg">
				<div className="inset-0 w-[500px] h-[750px] bg-muted animate-pulse" />
			</div>
			<div className="mt-2 space-y-1">
				<Skeleton className="h-4 w-3/4" /> {/* Title */}
				<Skeleton className="h-3 w-1/4" /> {/* Year */}
			</div>
		</div>
	);
}

export function MovieGridSkeleton() {
	return (
		<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
			{Array.from({ length: 20 }).map((_, i) => (
				<div key={i} className="">
					<MovieCardSkeleton />
				</div>
			))}
		</div>
	);
}
