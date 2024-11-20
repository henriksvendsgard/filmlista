export function MovieCardSkeleton() {
	return (
		<div className="relative group cursor-pointer w-full h-full">
			{/* Poster skeleton with proper sizing */}
			<div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden min-h-[300px] xl:min-h-[500px]">
				<div className="absolute inset-0 w-full h-full bg-muted animate-pulse" />
			</div>
		</div>
	);
}

export function MovieGridSkeleton() {
	return (
		<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 w-full max-w-[2400px] mx-auto">
			{Array.from({ length: 20 }).map((_, i) => (
				<div key={i} className="w-full min-w-[100px]">
					<MovieCardSkeleton />
				</div>
			))}
		</div>
	);
}
