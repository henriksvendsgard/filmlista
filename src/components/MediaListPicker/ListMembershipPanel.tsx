"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MediaRef, useListActions } from "@/contexts/ListActionsContext";
import { BookmarkPlus, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface ListMembershipPanelProps {
    media: MediaRef;
}

export function ListMembershipPanel({ media }: ListMembershipPanelProps) {
    const {
        lists,
        editableShared,
        readOnlyShared,
        lastUsedListId,
        getListName,
        getMediaListIds,
        ensureSingleMediaMembership,
        toggleListMembership,
        addToLastUsedList,
        createListAndAdd,
        canEditList,
    } = useListActions();

    const [isLoading, setIsLoading] = useState(true);
    const [pendingListId, setPendingListId] = useState<string | null>(null);
    const [newListName, setNewListName] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    const memberListIds = getMediaListIds(media.mediaId, media.mediaType);
    const lastUsedName = lastUsedListId ? getListName(lastUsedListId) : null;
    const canQuickAdd =
        lastUsedListId &&
        lastUsedName &&
        canEditList(lastUsedListId) &&
        !memberListIds.includes(lastUsedListId);

    useEffect(() => {
        let cancelled = false;
        setIsLoading(true);
        ensureSingleMediaMembership(media.mediaId, media.mediaType).finally(() => {
            if (!cancelled) setIsLoading(false);
        });
        return () => {
            cancelled = true;
        };
    }, [media.mediaId, media.mediaType, ensureSingleMediaMembership]);

    const handleToggle = async (listId: string, checked: boolean) => {
        setPendingListId(listId);
        await toggleListMembership(media, listId, !checked);
        setPendingListId(null);
    };

    const handleCreateList = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newListName.trim()) return;
        setIsCreating(true);
        await createListAndAdd(newListName.trim(), media);
        setNewListName("");
        setIsCreating(false);
    };

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Henter lister...
            </div>
        );
    }

    const hasEditableLists = lists.owned.length > 0 || editableShared.length > 0;

    return (
        <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold">Lister</h3>
                {canQuickAdd && (
                    <Button variant="secondary" size="sm" onClick={() => addToLastUsedList(media)}>
                        <BookmarkPlus className="mr-2 h-4 w-4" />
                        {lastUsedName}
                    </Button>
                )}
            </div>

            {!hasEditableLists && readOnlyShared.length === 0 && memberListIds.length === 0 && (
                <p className="text-sm text-muted-foreground">Du har ingen lister ennå.</p>
            )}

            {lists.owned.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Dine lister</p>
                    {lists.owned.map((list) => {
                        const isMember = memberListIds.includes(list.id);
                        const isPending = pendingListId === list.id;
                        return (
                            <label
                                key={list.id}
                                className="flex cursor-pointer items-center gap-3 rounded-md px-1 py-1 hover:bg-muted/50"
                            >
                                <Checkbox
                                    checked={isMember}
                                    disabled={isPending}
                                    onCheckedChange={(checked) => handleToggle(list.id, checked === true)}
                                />
                                <span className="text-sm">{list.name}</span>
                                {isPending && <Loader2 className="ml-auto h-3 w-3 animate-spin" />}
                            </label>
                        );
                    })}
                </div>
            )}

            {editableShared.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Delte lister (redigering)
                    </p>
                    {editableShared.map((list) => {
                        const isMember = memberListIds.includes(list.id);
                        const isPending = pendingListId === list.id;
                        return (
                            <label
                                key={list.id}
                                className="flex cursor-pointer items-center gap-3 rounded-md px-1 py-1 hover:bg-muted/50"
                            >
                                <Checkbox
                                    checked={isMember}
                                    disabled={isPending}
                                    onCheckedChange={(checked) => handleToggle(list.id, checked === true)}
                                />
                                <span className="text-sm">{list.name}</span>
                                {isPending && <Loader2 className="ml-auto h-3 w-3 animate-spin" />}
                            </label>
                        );
                    })}
                </div>
            )}

            {readOnlyShared.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Delte lister (kun lesing)
                    </p>
                    {readOnlyShared.map((list) => {
                        const isMember = memberListIds.includes(list.id);
                        return (
                            <div key={list.id} className="flex items-center gap-3 px-1 py-1 opacity-70">
                                <Checkbox checked={isMember} disabled />
                                <span className="text-sm">{list.name}</span>
                            </div>
                        );
                    })}
                </div>
            )}

            <form onSubmit={handleCreateList} className="space-y-2 border-t pt-4">
                <Label htmlFor="new-list-name" className="text-sm">
                    Opprett ny liste
                </Label>
                <div className="flex gap-2">
                    <Input
                        id="new-list-name"
                        placeholder="Listenavn"
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                        className="h-9"
                    />
                    <Button type="submit" size="sm" disabled={isCreating || !newListName.trim()}>
                        {isCreating ? "..." : "Opprett"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
