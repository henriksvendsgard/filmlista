"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { useEffect, useState } from "react";
import { TMDBMovie } from "@/types/movie";
import Image from "next/image";

const SearchInputSchema = z.object({
	search: z.string().min(2).max(50),
});

export default function SearchInput() {
	const router = useRouter();
	const [suggestions, setSuggestions] = useState<TMDBMovie[]>([]);
	const [showSuggestions, setShowSuggestions] = useState(false);

	const form = useForm<z.infer<typeof SearchInputSchema>>({
		resolver: zodResolver(SearchInputSchema),
		defaultValues: {
			search: "",
		},
	});

	function onSubmit(values: z.infer<typeof SearchInputSchema>) {
		router.push(`/search/${values.search}`);
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
			const url = new URL("https://api.themoviedb.org/3/search/movie");
			url.searchParams.set("query", value);
			url.searchParams.set("language", "en-US");
			url.searchParams.set("page", "1");
			url.searchParams.set("include_adult", "false");

			const response = await fetch(url.toString(), {
				headers: {
					Authorization: `Bearer ${process.env.NEXT_PUBLIC_TMDB_API_KEY}`,
					accept: "application/json",
				},
			});

			const data = await response.json();
			setSuggestions(data.results?.slice(0, 5) || []);
			setShowSuggestions(true);
		} catch (error) {
			console.error("Error fetching suggestions:", error);
		}
	};

	// Følger søkefeltet
	const searchValue = form.watch("search");

	// Debounce the input to prevent too many API calls
	useEffect(() => {
		const handler = setTimeout(() => {
			const currentValue = form.getValues("search");
			if (currentValue) {
				handleInputChange(currentValue);
			}
		}, 300);

		return () => clearTimeout(handler);
	}, [searchValue, form]);

	return (
		<Form {...form}>
			<form action={"."} onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
				<FormField
					control={form.control}
					name="search"
					render={({ field }) => (
						<FormItem>
							<FormControl>
								<div className="relative">
									<Input
										{...field}
										className="text-base after:hidden"
										type="search"
										placeholder="Søk etter en film..."
										autoComplete="off"
										autoCorrect="off"
										autoCapitalize="off"
										spellCheck="false"
										onFocus={() => {
											if (field.value) setShowSuggestions(true);
										}}
										onChange={(e) => {
											field.onChange(e);
											// The debounced effect will handle the API call
										}}
										onBlur={() => {
											setTimeout(() => setShowSuggestions(false), 200);
										}}
									/>
									{showSuggestions && suggestions.length > 0 && (
										<div className="absolute w-full bg-background border rounded-md mt-1 shadow-lg z-50 max-h-[300px] overflow-y-auto">
											{suggestions.map((movie) => (
												<div
													key={movie.id}
													className="px-4 py-2 hover:bg-accent cursor-pointer flex items-center gap-2"
													onClick={() => {
														router.push(`/movie/${movie.id}`);
														setShowSuggestions(false);
														form.reset();
													}}
												>
													{movie.poster_path && (
														<Image
															src={`https://image.tmdb.org/t/p/w45${movie.poster_path}`}
															alt={movie.title}
															className="h-12 w-8 object-cover rounded"
															width={100}
															height={100}
														/>
													)}
													<div>
														<div className="font-medium">{movie.title}</div>
														<div className="text-sm text-muted-foreground">{new Date(movie.release_date).getFullYear()}</div>
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
