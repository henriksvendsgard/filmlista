"use client";

import { Button } from "@/components/ui/button";
import { TVShowDetails } from "@/components/TVShowDetails/TVShowDetails";
import { TVShowDetailsSkeleton } from "@/components/TVShowDetails/TVShowDetailsSkeleton";
import { getTVShowDetails } from "@/lib/getTVShows";
import { TMDBTVShow } from "@/types/tvshow";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface TVShowDetailsPageProps {
    params: {
        id: string;
    };
}

export default function TVShowDetailsPage({ params }: TVShowDetailsPageProps) {
    const [tvshow, setTVShow] = useState<TMDBTVShow | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function fetchTVShow() {
            try {
                const tvshowData = await getTVShowDetails(params.id);
                setTVShow(tvshowData);
            } catch (error) {
                console.error("Error fetching TV show:", error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchTVShow();
    }, [params.id]);

    return (
        <div className="container mx-auto px-4 py-8">
            <Button variant="ghost" onClick={() => router.back()} className="mb-12">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Tilbake
            </Button>

            {isLoading || !tvshow ? <TVShowDetailsSkeleton /> : <TVShowDetails tvshow={tvshow} />}
        </div>
    );
}
