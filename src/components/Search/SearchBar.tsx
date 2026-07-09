"use client";

import { Loader2, Search } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { fetchSearchSuggestions, type SearchSuggestion } from "@/lib/searchSuggestions";
import { cn } from "@/lib/utils";

type SearchFormValues = {
    search: string;
};

export default function SearchInput() {
    const router = useRouter();
    const listboxId = useId();
    const inputRef = useRef<HTMLInputElement>(null);
    const abortRef = useRef<AbortController | null>(null);

    const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [fetchError, setFetchError] = useState(false);

    const form = useForm<SearchFormValues>({
        defaultValues: { search: "" },
    });

    const searchValue = form.watch("search");
    const optionCount = suggestions.length + (suggestions.length > 0 ? 1 : 0);

    function closeSuggestions() {
        setShowSuggestions(false);
        setActiveIndex(-1);
    }

    function navigateToSuggestion(result: SearchSuggestion) {
        router.push(`/${result.media_type === "movie" ? "movie" : "tvshow"}/${result.id}`);
        form.reset();
        closeSuggestions();
        inputRef.current?.blur();
    }

    function onSubmit(values: SearchFormValues) {
        const term = values.search.trim();
        if (term.length < 2 || term.length > 50) return;

        router.push(`/search/${encodeURIComponent(term)}`);
        form.reset();
        closeSuggestions();
        inputRef.current?.blur();
    }

    useEffect(() => {
        if (!searchValue || searchValue.length < 2) {
            abortRef.current?.abort();
            setSuggestions([]);
            setIsLoadingSuggestions(false);
            setFetchError(false);
            if (!searchValue) closeSuggestions();
            return;
        }

        const debounceTimer = setTimeout(async () => {
            abortRef.current?.abort();
            const controller = new AbortController();
            abortRef.current = controller;

            setIsLoadingSuggestions(true);
            setFetchError(false);

            try {
                const results = await fetchSearchSuggestions(searchValue, controller.signal);
                if (controller.signal.aborted) return;

                setSuggestions(results);
                setShowSuggestions(true);
                setActiveIndex(-1);
            } catch (error) {
                if (controller.signal.aborted) return;
                console.error("Error fetching suggestions:", error);
                setSuggestions([]);
                setFetchError(true);
                setShowSuggestions(true);
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoadingSuggestions(false);
                }
            }
        }, 300);

        return () => {
            clearTimeout(debounceTimer);
        };
    }, [searchValue]);

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (!showSuggestions || optionCount === 0) {
            if (event.key === "Escape") closeSuggestions();
            return;
        }

        switch (event.key) {
            case "ArrowDown":
                event.preventDefault();
                setActiveIndex((prev) => (prev + 1) % optionCount);
                break;
            case "ArrowUp":
                event.preventDefault();
                setActiveIndex((prev) => (prev <= 0 ? optionCount - 1 : prev - 1));
                break;
            case "Enter":
                if (activeIndex >= 0 && activeIndex < suggestions.length) {
                    event.preventDefault();
                    navigateToSuggestion(suggestions[activeIndex]);
                } else if (activeIndex === suggestions.length) {
                    event.preventDefault();
                    form.handleSubmit(onSubmit)();
                }
                break;
            case "Escape":
                event.preventDefault();
                closeSuggestions();
                break;
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-full" role="search">
                <FormField
                    control={form.control}
                    name="search"
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <div className="relative">
                                    <label htmlFor="filmlista-search" className="sr-only">
                                        Søk etter filmer og TV-serier
                                    </label>
                                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        {...field}
                                        ref={(element) => {
                                            field.ref(element);
                                            inputRef.current = element;
                                        }}
                                        id="filmlista-search"
                                        type="search"
                                        enterKeyHint="search"
                                        autoComplete="off"
                                        placeholder="Søk etter filmer og TV-serier..."
                                        className="w-full pl-9 pr-9 text-base"
                                        role="combobox"
                                        aria-expanded={showSuggestions}
                                        aria-controls={listboxId}
                                        aria-autocomplete="list"
                                        aria-activedescendant={
                                            activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
                                        }
                                        onFocus={() => {
                                            if (suggestions.length > 0 || fetchError) {
                                                setShowSuggestions(true);
                                            }
                                        }}
                                        onKeyDown={handleKeyDown}
                                        onBlur={() => {
                                            field.onBlur();
                                            window.setTimeout(() => closeSuggestions(), 150);
                                        }}
                                    />
                                    {isLoadingSuggestions && (
                                        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                                    )}

                                    {showSuggestions && (
                                        <div
                                            id={listboxId}
                                            role="listbox"
                                            aria-label="Søkeforslag"
                                            className="absolute z-50 mt-1 max-h-[300px] w-full overflow-y-auto rounded-md border bg-background shadow-lg"
                                            onMouseDown={(event) => event.preventDefault()}
                                        >
                                            {fetchError && (
                                                <p className="px-4 py-3 text-sm text-muted-foreground">
                                                    Kunne ikke hente forslag. Trykk Enter for å søke.
                                                </p>
                                            )}

                                            {!fetchError && suggestions.length === 0 && !isLoadingSuggestions && (
                                                <p className="px-4 py-3 text-sm text-muted-foreground">
                                                    Ingen forslag. Trykk Enter for fullt søk.
                                                </p>
                                            )}

                                            {suggestions.map((result, index) => (
                                                <div
                                                    key={result.id}
                                                    id={`${listboxId}-option-${index}`}
                                                    role="option"
                                                    aria-selected={activeIndex === index}
                                                    className={cn(
                                                        "flex cursor-pointer items-center gap-2 px-4 py-2",
                                                        activeIndex === index ? "bg-accent" : "hover:bg-accent"
                                                    )}
                                                    onMouseEnter={() => setActiveIndex(index)}
                                                    onClick={() => navigateToSuggestion(result)}
                                                >
                                                    <Image
                                                        src={`https://image.tmdb.org/t/p/w45${result.poster_path}`}
                                                        alt=""
                                                        className="h-12 w-8 rounded object-cover"
                                                        width={32}
                                                        height={48}
                                                    />
                                                    <div className="min-w-0">
                                                        <div className="truncate font-medium">
                                                            {result.title || result.name}
                                                        </div>
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

                                            {suggestions.length > 0 && (
                                                <div
                                                    id={`${listboxId}-option-${suggestions.length}`}
                                                    role="option"
                                                    aria-selected={activeIndex === suggestions.length}
                                                    className={cn(
                                                        "cursor-pointer border-t px-4 py-3 text-sm font-medium text-filmlista-primary",
                                                        activeIndex === suggestions.length ? "bg-accent" : "hover:bg-accent"
                                                    )}
                                                    onMouseEnter={() => setActiveIndex(suggestions.length)}
                                                    onClick={() => form.handleSubmit(onSubmit)()}
                                                >
                                                    Vis alle resultater for «{searchValue}»
                                                </div>
                                            )}
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
