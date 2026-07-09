"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import type { CSSProperties } from "react";

export interface Watcher {
    user_id: string;
    displayname: string;
    watched_at: string;
}

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
}

function formatWatchedSummary(watchers: Watcher[], currentUserId?: string): string {
    const others = watchers.filter((watcher) => watcher.user_id !== currentUserId);
    const includesMe = !!currentUserId && watchers.some((watcher) => watcher.user_id === currentUserId);

    if (includesMe && others.length === 0) return "Sett av deg";
    if (includesMe && others.length === 1) return `Sett av deg og ${others[0].displayname}`;
    if (includesMe && others.length > 1) return `Sett av deg og ${others.length} andre`;
    if (others.length === 1) return `Sett av ${others[0].displayname}`;
    if (others.length === 2) return `Sett av ${others[0].displayname} og ${others[1].displayname}`;
    return `Sett av ${others.length} personer`;
}

function formatWatchedSummaryCompact(watchers: Watcher[], currentUserId?: string): string {
    const others = watchers.filter((watcher) => watcher.user_id !== currentUserId);
    const includesMe = !!currentUserId && watchers.some((watcher) => watcher.user_id === currentUserId);

    if (watchers.length === 1 && includesMe) return "Sett av deg";
    if (watchers.length === 1) {
        const firstName = others[0]?.displayname.split(/\s+/)[0] ?? "ukjent";
        return firstName.length > 9 ? `Sett av ${firstName.slice(0, 8)}…` : `Sett av ${firstName}`;
    }
    if (includesMe) return `Sett av deg +${others.length}`;
    return `Sett av ${watchers.length}`;
}

function formatWatchedDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.round((startOfToday.getTime() - startOfDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "I dag";
    if (diffDays === 1) return "I går";
    if (diffDays < 7) return `${diffDays} dager siden`;
    if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return weeks === 1 ? "1 uke siden" : `${weeks} uker siden`;
    }

    return date.toLocaleDateString("nb-NO", {
        day: "numeric",
        month: "short",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
}

function WatcherAvatar({
    watcher,
    isMe,
    className,
    style,
}: {
    watcher: Watcher;
    isMe: boolean;
    className?: string;
    style?: CSSProperties;
}) {
    return (
        <div
            style={style}
            title={isMe ? "Deg" : watcher.displayname}
            className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full border border-white/20 text-[9px] font-semibold leading-none",
                isMe ? "bg-green-700 text-white" : "bg-muted text-foreground",
                className
            )}
        >
            {isMe ? <Check className="size-3 shrink-0" strokeWidth={2.5} /> : getInitials(watcher.displayname || "?")}
        </div>
    );
}

function WatcherAvatarStack({
    watchers,
    currentUserId,
}: {
    watchers: Watcher[];
    currentUserId?: string;
}) {
    const visible = watchers.slice(0, 3);

    return (
        <div
            className={cn(
                "flex shrink-0 items-center",
                visible.length === 1 && "w-5",
                visible.length === 2 && "w-8.5",
                visible.length >= 3 && "w-12"
            )}
        >
            {visible.map((watcher, index) => (
                <WatcherAvatar
                    key={watcher.user_id}
                    watcher={watcher}
                    isMe={watcher.user_id === currentUserId}
                    className={index > 0 ? "-ml-1.5" : undefined}
                    style={{ zIndex: visible.length - index }}
                />
            ))}
        </div>
    );
}

interface WatchedByIndicatorProps {
    watchers: Watcher[];
    currentUserId?: string;
    className?: string;
}

export function WatchedByIndicator({ watchers, currentUserId, className }: WatchedByIndicatorProps) {
    if (watchers.length === 0) return null;

    const sortedWatchers = [...watchers].sort((a, b) => {
        if (a.user_id === currentUserId) return -1;
        if (b.user_id === currentUserId) return 1;
        return new Date(b.watched_at).getTime() - new Date(a.watched_at).getTime();
    });

    const summary = formatWatchedSummary(sortedWatchers, currentUserId);
    const compactSummary = formatWatchedSummaryCompact(sortedWatchers, currentUserId);
    const dialogTitle =
        sortedWatchers.length === 1 && sortedWatchers[0].user_id === currentUserId
            ? "Sett av deg"
            : `Sett av ${sortedWatchers.length} ${sortedWatchers.length === 1 ? "person" : "personer"}`;

    return (
        <Dialog>
            <DialogTrigger asChild>
                <button
                    type="button"
                    aria-label={summary}
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    className={cn(
                        "inline-flex min-w-0 max-w-full items-center gap-1 rounded-full bg-black/70 py-1 pl-1 pr-2 text-left text-xs text-white backdrop-blur-sm transition-colors hover:bg-black/80",
                        className
                    )}
                >
                    <WatcherAvatarStack watchers={sortedWatchers} currentUserId={currentUserId} />
                    <span className="min-w-0 truncate font-medium leading-none">{compactSummary}</span>
                </button>
            </DialogTrigger>
            <DialogContent className="max-w-sm rounded-lg" onClick={(e) => e.stopPropagation()}>
                <DialogHeader>
                    <DialogTitle>{dialogTitle}</DialogTitle>
                </DialogHeader>
                <ul className="space-y-2">
                    {sortedWatchers.map((watcher) => {
                        const isMe = watcher.user_id === currentUserId;
                        return (
                            <li
                                key={watcher.user_id}
                                className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2"
                            >
                                <div className="flex min-w-0 items-center gap-2.5">
                                    <WatcherAvatar watcher={watcher} isMe={isMe} className="h-7 w-7 text-[10px]" />
                                    <span className="truncate text-sm font-medium">
                                        {isMe ? "Deg" : watcher.displayname}
                                    </span>
                                </div>
                                <span className="shrink-0 text-xs text-muted-foreground">
                                    {formatWatchedDate(watcher.watched_at)}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            </DialogContent>
        </Dialog>
    );
}
