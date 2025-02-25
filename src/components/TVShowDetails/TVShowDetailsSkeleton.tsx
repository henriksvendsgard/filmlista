import { Skeleton } from "@/components/ui/skeleton";

export function TVShowDetailsSkeleton() {
	return (
		<div className="space-y-12">
			{/* Mobile backdrop */}
			<div className="lg:hidden">
				<Skeleton className="w-full aspect-[2.76/1] rounded-xl" />
			</div>

			<div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
				{/* Desktop poster */}
				<div className="hidden xl:block xl:col-span-1">
					<Skeleton className="aspect-[2/3] w-full rounded-lg" />
				</div>

				<div className="col-span-1 xl:col-span-2">
					{/* Title and metadata */}
					<div className="flex flex-col gap-4 mb-6">
						<Skeleton className="h-10 w-2/3" />
						<Skeleton className="h-6 w-1/3" />
						<Skeleton className="h-12 w-12 rounded-full" />
					</div>

					{/* Overview */}
					<div className="mb-8">
						<Skeleton className="h-8 w-1/4 mb-2" />
						<Skeleton className="h-24 w-full" />
					</div>

					{/* Genres */}
					<div className="mb-8">
						<Skeleton className="h-8 w-1/4 mb-4" />
						<div className="flex flex-wrap gap-2">
							{Array.from({ length: 4 }).map((_, i) => (
								<Skeleton key={i} className="h-7 w-20" />
							))}
						</div>
					</div>

					{/* Cast */}
					<div className="space-y-4">
						<Skeleton className="h-8 w-40" />
						<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
							{[1, 2, 3, 4, 5, 6].map((i) => (
								<div key={i} className="flex items-center space-x-3">
									<Skeleton className="h-[45px] w-[45px] rounded-full" />
									<div className="space-y-2">
										<Skeleton className="h-4 w-24" />
										<Skeleton className="h-3 w-20" />
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Watch Providers */}
					<div className="my-8 space-y-6 border-t pt-8">
						<Skeleton className="h-8 w-40" />
						<div className="grid gap-8 sm:grid-cols-3">
							{[1, 2, 3].map((section) => (
								<div key={section}>
									<Skeleton className="h-6 w-24 mb-4" />
									<div className="flex flex-wrap gap-3">
										{[1, 2, 3].map((provider) => (
											<Skeleton key={provider} className="h-[50px] w-[50px] rounded-lg" />
										))}
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Seasons */}
					<div>
						<Skeleton className="h-8 w-1/4 mb-4" />
						<div className="space-y-4">
							{Array.from({ length: 4 }).map((_, i) => (
								<Skeleton key={i} className="h-20 w-full rounded-lg" />
							))}
						</div>
					</div>
				</div>
			</div>

			{/* Similar Shows */}
			<div className="mt-8 space-y-6 border-t pt-16">
				<Skeleton className="h-8 w-1/4 mb-4" />
				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
					{Array.from({ length: 8 }).map((_, i) => (
						<Skeleton key={i} className="aspect-[2/3] rounded-lg" />
					))}
				</div>
			</div>
		</div>
	);
}
