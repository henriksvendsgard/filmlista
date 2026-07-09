"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ListWithStats } from "@/lib/listRepository";
import { Film, MoreVertical, Pencil, Share, Trash2, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface ListCardProps {
    list: ListWithStats;
    variant: "owned" | "shared";
    onEdit?: (list: ListWithStats) => void;
    onShare?: (list: ListWithStats) => void;
    onDelete?: (list: ListWithStats) => void;
}

function formatItemCount(count: number) {
    if (count === 0) return "Ingen titler";
    if (count === 1) return "1 tittel";
    return `${count} titler`;
}

function formatDate(date?: string) {
    if (!date) return "";
    return new Date(date).toLocaleDateString("nb-NO", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

export function ListCard({ list, variant, onEdit, onShare, onDelete }: ListCardProps) {
    const href = `/watchlist?list=${list.id}`;

    return (
        <Card className="group overflow-hidden transition-shadow hover:shadow-md">
            <Link href={href} className="block">
                <div className="relative aspect-2/1 bg-muted/50">
                    {list.posterPaths.length > 0 ? (
                        <div className="grid h-full grid-cols-4 gap-0.5">
                            {Array.from({ length: 4 }).map((_, index) => {
                                const poster = list.posterPaths[index];
                                return (
                                    <div key={index} className="relative overflow-hidden bg-muted">
                                        {poster ? (
                                            <Image
                                                src={`https://image.tmdb.org/t/p/w200${poster}`}
                                                alt=""
                                                fill
                                                className="object-cover transition-transform group-hover:scale-105"
                                                sizes="120px"
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-filmlista-primary/10 text-filmlista-primary">
                                                    <Film className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-2">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-filmlista-primary/10 text-filmlista-primary">
                                <Film className="h-6 w-6 shrink-0" strokeWidth={1.75} />
                            </div>
                            <span className="text-sm text-muted-foreground">Tom liste</span>
                        </div>
                    )}
                </div>
            </Link>

            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                        <Link href={href} className="hover:underline">
                            <h3 className="truncate text-lg font-semibold">{list.name}</h3>
                        </Link>
                        <p className="mt-1 text-sm text-muted-foreground">{formatItemCount(list.itemCount)}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {list.created_at && (
                                <Badge variant="secondary" className="text-xs font-normal">
                                    {formatDate(list.created_at)}
                                </Badge>
                            )}
                            {variant === "owned" && (list.sharedCount ?? 0) > 0 && (
                                <Badge variant="outline" className="gap-1 text-xs font-normal">
                                    <Users className="h-3 w-3" />
                                    Delt med {list.sharedCount}
                                </Badge>
                            )}
                            {variant === "shared" && list.ownerName && (
                                <Badge variant="outline" className="text-xs font-normal">
                                    Eies av {list.ownerName}
                                </Badge>
                            )}
                        </div>
                    </div>

                    {variant === "owned" && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="shrink-0">
                                    <MoreVertical className="h-4 w-4" />
                                    <span className="sr-only">Handlinger</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onEdit?.(list)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Endre navn
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onShare?.(list)}>
                                    <Share className="mr-2 h-4 w-4" />
                                    Del liste
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="text-red-600 focus:text-red-600"
                                    onClick={() => onDelete?.(list)}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Slett liste
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
