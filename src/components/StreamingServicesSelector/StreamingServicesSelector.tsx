"use client";

import {
    NORWEGIAN_STREAMING_PROVIDERS,
    StreamingProvider,
    fetchNorwegianStreamingProviders,
    getProviderLogoUrl,
} from "@/lib/streamingProviders";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

interface StreamingServicesSelectorProps {
    selected: number[];
    onChange: (selected: number[]) => void;
    disabled?: boolean;
}

export function StreamingServicesSelector({ selected, onChange, disabled }: StreamingServicesSelectorProps) {
    const [providers, setProviders] = useState<StreamingProvider[]>(NORWEGIAN_STREAMING_PROVIDERS);

    useEffect(() => {
        fetchNorwegianStreamingProviders().then(setProviders);
    }, []);

    const toggleProvider = (providerId: number) => {
        if (disabled) return;

        if (selected.includes(providerId)) {
            onChange(selected.filter((id) => id !== providerId));
        } else {
            onChange([...selected, providerId]);
        }
    };

    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {providers.map((provider) => {
                const isSelected = selected.includes(provider.id);

                return (
                    <button
                        key={provider.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => toggleProvider(provider.id)}
                        className={cn(
                            "relative flex min-w-0 items-center gap-2 overflow-hidden rounded-lg border p-3 pr-8 text-left transition-colors",
                            isSelected
                                ? "border-filmlista-primary bg-filmlista-primary/10"
                                : "border-border hover:border-muted-foreground/50",
                            disabled && "cursor-not-allowed opacity-50"
                        )}
                    >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                            <Image
                                src={getProviderLogoUrl(provider.logoPath, "w45")}
                                alt={provider.name}
                                width={36}
                                height={36}
                                className="rounded-md object-contain"
                                unoptimized
                            />
                        </div>
                        <span
                            className="min-w-0 flex-1 truncate text-sm font-medium leading-tight"
                            title={provider.name}
                        >
                            {provider.name}
                        </span>
                        {isSelected && (
                            <Check className="absolute right-2 top-2 h-4 w-4 shrink-0 text-filmlista-primary" />
                        )}
                    </button>
                );
            })}
        </div>
    );
}
