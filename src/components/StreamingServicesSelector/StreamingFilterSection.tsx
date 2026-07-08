"use client";

import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useStreamingServices } from "@/hooks/useStreamingServices";
import {
    fetchNorwegianStreamingProviders,
    getProviderLogoUrl,
    NORWEGIAN_STREAMING_PROVIDERS,
    StreamingProvider,
} from "@/lib/streamingProviders";
import { cn } from "@/lib/utils";
import { Loader2, MousePointerClick, Pencil } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";

interface StreamingFilterSectionProps {
    filterActive?: boolean;
    onFilterChange?: (active: boolean) => void;
    showFilter?: boolean;
    loadingProviders?: boolean;
    className?: string;
}

function ProviderLogo({
    provider,
    className,
    style,
}: {
    provider: StreamingProvider;
    className?: string;
    style?: CSSProperties;
}) {
    return (
        <div
            style={style}
            className={cn(
                "relative h-8 w-8 shrink-0 overflow-hidden rounded-full border bg-background",
                className
            )}
        >
            <Image
                src={getProviderLogoUrl(provider.logoPath, "w154")}
                alt={provider.name}
                width={32}
                height={32}
                className="h-full w-full object-cover"
                unoptimized
            />
        </div>
    );
}

function StreamingServicesList({
    providers,
    filterActive,
}: {
    providers: StreamingProvider[];
    filterActive?: boolean;
}) {
    return (
        <div className="space-y-2">
            <p className="text-sm font-medium">
                {filterActive ? "Filtrerer på disse tjenestene" : "Dine strømmetjenester"}
            </p>
            <ul className="space-y-2">
                {providers.map((provider) => (
                    <li key={provider.id} className="flex items-center gap-2.5">
                        <ProviderLogo provider={provider} />
                        <span className="text-sm">{provider.name}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function ProviderStack({
    visibleProviders,
    overflowCount,
    filterActive,
    ringWhenActive,
}: {
    visibleProviders: StreamingProvider[];
    overflowCount: number;
    filterActive?: boolean;
    ringWhenActive?: boolean;
}) {
    return (
        <>
            {visibleProviders.map((provider, index) => (
                <ProviderLogo
                    key={provider.id}
                    provider={provider}
                    className={cn(
                        "border-2 border-background bg-background shadow-sm",
                        index > 0 && "-ml-2.5",
                        ringWhenActive && filterActive && "ring-1 ring-filmlista-primary/60"
                    )}
                    style={{ zIndex: visibleProviders.length - index }}
                />
            ))}
            {overflowCount > 0 && (
                <div
                    className="-ml-2.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-semibold text-muted-foreground"
                    style={{ zIndex: 0 }}
                >
                    +{overflowCount}
                </div>
            )}
        </>
    );
}

function ProviderStackPopover({
    selectedProviders,
    visibleProviders,
    overflowCount,
    filterActive,
    ringWhenActive,
}: {
    selectedProviders: StreamingProvider[];
    visibleProviders: StreamingProvider[];
    overflowCount: number;
    filterActive?: boolean;
    ringWhenActive?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const scheduleClose = () => {
        closeTimer.current = setTimeout(() => setOpen(false), 120);
    };

    const cancelClose = () => {
        if (closeTimer.current) {
            clearTimeout(closeTimer.current);
            closeTimer.current = null;
        }
    };

    useEffect(() => {
        return () => {
            if (closeTimer.current) clearTimeout(closeTimer.current);
        };
    }, []);

    return (
        <HoverCard open={open} onOpenChange={setOpen} openDelay={0} closeDelay={80}>
            <HoverCardTrigger asChild>
                <button
                    type="button"
                    aria-label={`Vis ${selectedProviders.length} strømmetjenester`}
                    onClick={(e) => {
                        e.stopPropagation();
                        setOpen((prev) => !prev);
                    }}
                    onPointerEnter={() => {
                        cancelClose();
                        setOpen(true);
                    }}
                    onPointerLeave={scheduleClose}
                    className="flex shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors hover:bg-muted/80 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-filmlista-primary/50"
                >
                    <ProviderStack
                        visibleProviders={visibleProviders}
                        overflowCount={overflowCount}
                        filterActive={filterActive}
                        ringWhenActive={ringWhenActive}
                    />
                </button>
            </HoverCardTrigger>
            <HoverCardContent
                align="start"
                side="bottom"
                className="w-56 p-3"
                onPointerEnter={cancelClose}
                onPointerLeave={scheduleClose}
                onClick={(e) => e.stopPropagation()}
            >
                <StreamingServicesList providers={selectedProviders} filterActive={filterActive} />
            </HoverCardContent>
        </HoverCard>
    );
}

export function StreamingFilterSection({
    filterActive = false,
    onFilterChange,
    showFilter = true,
    loadingProviders = false,
    className,
}: StreamingFilterSectionProps) {
    const { services, hasServices, isLoading } = useStreamingServices();
    const [providers, setProviders] = useState<StreamingProvider[]>(NORWEGIAN_STREAMING_PROVIDERS);

    useEffect(() => {
        fetchNorwegianStreamingProviders().then(setProviders);
    }, []);

    if (isLoading) {
        return <Skeleton className={cn("h-11 w-full max-w-md rounded-xl", className)} />;
    }

    if (!hasServices) {
        return (
            <Link
                href="/profile"
                className={cn(
                    "inline-flex text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline",
                    className
                )}
            >
                Legg til strømmetjenester i profilen
            </Link>
        );
    }

    const selectedProviders = providers.filter((provider) => services.includes(provider.id));
    const isInteractive = showFilter && !!onFilterChange;
    const maxVisible = 4;
    const visibleProviders = selectedProviders.slice(0, maxVisible);
    const overflowCount = selectedProviders.length - maxVisible;

    const stackPopover = (
        <ProviderStackPopover
            selectedProviders={selectedProviders}
            visibleProviders={visibleProviders}
            overflowCount={overflowCount}
            filterActive={filterActive}
            ringWhenActive={isInteractive}
        />
    );

    const editButton = (
        <Link
            href="/profile"
            onClick={(e) => e.stopPropagation()}
            title="Endre strømmetjenester"
            aria-label="Endre strømmetjenester"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:border-filmlista-primary/40 hover:bg-filmlista-primary/10 hover:text-filmlista-primary"
        >
            <Pencil className="h-3.5 w-3.5" />
        </Link>
    );

    const statusBadge = isInteractive && (
        <span
            className={cn(
                "rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
                filterActive ? "bg-filmlista-primary text-white" : "bg-muted text-muted-foreground"
            )}
        >
            {filterActive ? "På" : "Av"}
        </span>
    );

    const filterLabel = isInteractive ? (
        <span
            className={cn(
                "shrink-0 text-xs font-medium sm:text-sm",
                filterActive ? "text-filmlista-primary" : "text-foreground"
            )}
        >
            {filterActive ? "Kun dine tjenester" : "Filtrer på tjenester"}
        </span>
    ) : (
        <span className="shrink-0 text-sm font-medium text-muted-foreground">Mine tjenester</span>
    );

    const shellClass = cn(
        "flex w-full max-w-md items-center justify-between gap-3 rounded-xl border-2 px-3 py-2.5 sm:px-4",
        filterActive && isInteractive
            ? "border-filmlista-primary bg-filmlista-primary/10 shadow-sm"
            : isInteractive
              ? "border-dashed border-muted-foreground/30 bg-background shadow-sm"
              : "border-border bg-muted/30",
        className
    );

    if (isInteractive) {
        const toggleFilter = () => {
            if (!loadingProviders) onFilterChange(!filterActive);
        };

        return (
            <div
                role="button"
                tabIndex={0}
                aria-pressed={filterActive}
                onClick={toggleFilter}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleFilter();
                    }
                }}
                className={cn(
                    shellClass,
                    "cursor-pointer transition-all hover:shadow-md active:scale-[0.99]",
                    !filterActive && "hover:border-filmlista-primary/50 hover:bg-filmlista-primary/5",
                    loadingProviders && "cursor-wait opacity-80"
                )}
            >
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    {!filterActive && (
                        <MousePointerClick
                            className="hidden h-4 w-4 shrink-0 text-muted-foreground/70 sm:block"
                            aria-hidden
                        />
                    )}
                    {filterLabel}
                </div>

                <div
                    className="shrink-0"
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    {stackPopover}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    {loadingProviders && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    {statusBadge}
                    <div onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                        {editButton}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={shellClass}>
            <div className="flex min-w-0 flex-1 items-center gap-2.5">{filterLabel}</div>
            {stackPopover}
            {editButton}
        </div>
    );
}
