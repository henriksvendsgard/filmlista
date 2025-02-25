import { Skeleton } from "@/components/ui/skeleton";

export function TVShowDetailsSkeleton() {
	return (
		<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
			<div className="md:col-span-1">
				<Skeleton className="aspect-[2/3] w-full rounded-lg" />
			</div>

			<div className="md:col-span-2">
				<Skeleton className="h-10 w-2/3 mb-2" />
				<Skeleton className="h-6 w-1/3 mb-6" />

				<div className="mb-6">
					<Skeleton className="h-8 w-1/4 mb-2" />
					<Skeleton className="h-24 w-full" />
				</div>

				<div className="mb-6">
					<Skeleton className="h-8 w-1/4 mb-2" />
					<div className="flex flex-wrap gap-2">
						{Array.from({ length: 4 }).map((_, i) => (
							<Skeleton key={i} className="h-7 w-20" />
						))}
					</div>
				</div>

				<div>
					<Skeleton className="h-8 w-1/4 mb-4" />
					<div className="space-y-4">
						{Array.from({ length: 3 }).map((_, i) => (
							<Skeleton key={i} className="h-20 w-full rounded-lg" />
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
