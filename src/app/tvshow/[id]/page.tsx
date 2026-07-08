import { TVShowDetails } from "@/components/TVShowDetails/TVShowDetails";
import { Button } from "@/components/ui/button";
import { getTVShowPageData } from "@/lib/tmdb/tv";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface TVShowDetailsPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function TVShowDetailsPage({ params }: TVShowDetailsPageProps) {
    const { id } = await params;

    let tvshow;
    try {
        tvshow = await getTVShowPageData(id);
    } catch {
        notFound();
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <Button variant="ghost" asChild className="mb-12">
                <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Tilbake
                </Link>
            </Button>
            <TVShowDetails tvshow={tvshow} />
        </div>
    );
}
