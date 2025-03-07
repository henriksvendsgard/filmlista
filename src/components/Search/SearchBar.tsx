"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { useEffect, useState } from "react";
import { TMDBMovie } from "@/types/movie";
import { TMDBTVShow } from "@/types/tvshow";
import Image from "next/image";

const SearchInputSchema = z.object({
    search: z.string().min(2).max(50),
});

type SearchResult = {
    id: number;
    title: string;
    name?: string;
    poster_path: string | null;
    release_date?: string;
    first_air_date?: string;
    media_type: "movie" | "tv";
};

export default function SearchInput() {
    const router = useRouter();
    const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const form = useForm<z.infer<typeof SearchInputSchema>>({
        resolver: zodResolver(SearchInputSchema),
        defaultValues: {
            search: "",
        },
    });

    function onSubmit(values: z.infer<typeof SearchInputSchema>) {
        const encodedTerm = encodeURIComponent(values.search);
        router.push(`/search/${encodedTerm}`);
        form.reset();
        setShowSuggestions(false);
        (document.activeElement as HTMLElement)?.blur();
    }

    const handleInputChange = async (value: string) => {
        if (value.length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        try {
            const url = new URL("https://api.themoviedb.org/3/search/multi");
            url.searchParams.set("query", value);
            url.searchParams.set("language", "no-NO");
            url.searchParams.set("page", "1");
            url.searchParams.set("include_adult", "false");

            const response = await fetch(url.toString(), {
                headers: {
                    Authorization: `Bearer ${process.env.NEXT_PUBLIC_TMDB_API_KEY}`,
                    accept: "application/json",
                },
            });

            const data = await response.json();
            const filteredResults = data.results
                ?.filter(
                    (result: any) => (result.media_type === "movie" || result.media_type === "tv") && result.poster_path
                )
                .slice(0, 5);
            setSuggestions(filteredResults || []);
            setShowSuggestions(true);
        } catch (error) {
            console.error("Error fetching suggestions:", error);
        }
    };

    const searchValue = form.watch("search");

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            if (searchValue) {
                handleInputChange(searchValue);
            }
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [searchValue]);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
                <FormField
                    control={form.control}
                    name="search"
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <div className="relative">
                                    <Input
                                        placeholder="Søk etter filmer og TV-serier..."
                                        {...field}
                                        className="w-full text-base"
                                        onFocus={() => {
                                            if (suggestions.length > 0) {
                                                setShowSuggestions(true);
                                            }
                                        }}
                                        onBlur={() => {
                                            setTimeout(() => {
                                                setShowSuggestions(false);
                                            }, 200);
                                        }}
                                    />

                                    {showSuggestions && suggestions.length > 0 && (
                                        <div className="absolute z-50 mt-1 max-h-[300px] w-full overflow-y-auto rounded-md border bg-background shadow-lg">
                                            {suggestions.map((result) => (
                                                <div
                                                    key={result.id}
                                                    className="flex cursor-pointer items-center gap-2 px-4 py-2 hover:bg-accent"
                                                    onClick={() => {
                                                        router.push(
                                                            `/${result.media_type === "movie" ? "movie" : "tvshow"}/${result.id}`
                                                        );
                                                        setShowSuggestions(false);
                                                        form.reset();
                                                    }}
                                                >
                                                    {result.poster_path && (
                                                        <Image
                                                            src={`https://image.tmdb.org/t/p/w45${result.poster_path}`}
                                                            alt={result.title || result.name || ""}
                                                            className="h-12 w-8 rounded object-cover"
                                                            width={100}
                                                            height={100}
                                                        />
                                                    )}
                                                    <div>
                                                        <div className="font-medium">{result.title || result.name}</div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {result.release_date || result.first_air_date
                                                                ? new Date(
                                                                      result.release_date || result.first_air_date || ""
                                                                  ).getFullYear()
                                                                : ""}
                                                            {" • "}
                                                            {result.media_type === "movie" ? "Film" : "TV-serie"}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </FormControl>
                        </FormItem>
                    )}
                />
            </form>
        </Form>
    );
}
