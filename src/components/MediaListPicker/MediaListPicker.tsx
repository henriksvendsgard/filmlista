"use client";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { MediaRef, useListActions } from "@/contexts/ListActionsContext";
import { BookmarkPlus, Ellipsis, Loader2 } from "lucide-react";
import { useState } from "react";

interface MediaListPickerProps {
    media: MediaRef;
    trigger?: React.ReactNode;
    align?: "start" | "center" | "end";
    showQuickAdd?: boolean;
}

export function MediaListPicker({
    media,
    trigger,
    align = "end",
    showQuickAdd = true,
}: MediaListPickerProps) {
    const {
        lists,
        editableShared,
        readOnlyShared,
        lastUsedListId,
        getListName,
        getMediaListIds,
        ensureSingleMediaMembership,
        addToList,
        addToLastUsedList,
        removeFromList,
        createListAndAdd,
        canEditList,
    } = useListActions();

    const [isOpen, setIsOpen] = useState(false);
    const [isLoadingMembership, setIsLoadingMembership] = useState(false);
    const [newListName, setNewListName] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    const memberListIds = getMediaListIds(media.mediaId, media.mediaType);
    const editableLists = [...lists.owned, ...editableShared];
    const availableEditable = editableLists.filter((list) => !memberListIds.includes(list.id));
    const memberLists = [...lists.owned, ...lists.shared, ...readOnlyShared].filter((list) =>
        memberListIds.includes(list.id)
    );
    const lastUsedName = lastUsedListId ? getListName(lastUsedListId) : null;
    const canQuickAdd =
        showQuickAdd &&
        lastUsedListId &&
        lastUsedName &&
        canEditList(lastUsedListId) &&
        !memberListIds.includes(lastUsedListId);

    const handleOpenChange = async (open: boolean) => {
        setIsOpen(open);
        if (open) {
            setIsLoadingMembership(true);
            await ensureSingleMediaMembership(media.mediaId, media.mediaType);
            setIsLoadingMembership(false);
        }
    };

    const handleCreateList = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newListName.trim()) return;
        setIsCreating(true);
        await createListAndAdd(newListName.trim(), media);
        setNewListName("");
        setIsCreating(false);
        setIsOpen(false);
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
            <DropdownMenuTrigger asChild>
                {trigger ?? (
                    <Button variant="outline" size="icon" className="rounded-full">
                        <Ellipsis className="h-4 w-4" />
                    </Button>
                )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align={align} className="w-64">
                {isLoadingMembership ? (
                    <DropdownMenuItem disabled className="justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin" />
                    </DropdownMenuItem>
                ) : (
                    <>
                        {canQuickAdd && (
                            <>
                                <DropdownMenuItem onClick={() => addToLastUsedList(media)}>
                                    <BookmarkPlus className="mr-2 h-4 w-4" />
                                    Legg til i {lastUsedName}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                            </>
                        )}

                        {availableEditable.length > 0 && (
                            <>
                                {lists.owned.some((list) => !memberListIds.includes(list.id)) && (
                                    <>
                                        <DropdownMenuItem disabled className="text-muted-foreground">
                                            Dine lister
                                        </DropdownMenuItem>
                                        {lists.owned
                                            .filter((list) => !memberListIds.includes(list.id))
                                            .map((list) => (
                                                <DropdownMenuItem
                                                    key={list.id}
                                                    onClick={() => addToList(media, list.id)}
                                                >
                                                    Legg til i {list.name}
                                                </DropdownMenuItem>
                                            ))}
                                    </>
                                )}

                                {editableShared.some((list) => !memberListIds.includes(list.id)) && (
                                    <>
                                        {lists.owned.some((list) => !memberListIds.includes(list.id)) && (
                                            <DropdownMenuSeparator />
                                        )}
                                        <DropdownMenuItem disabled className="text-muted-foreground">
                                            Delte lister (redigering)
                                        </DropdownMenuItem>
                                        {editableShared
                                            .filter((list) => !memberListIds.includes(list.id))
                                            .map((list) => (
                                                <DropdownMenuItem
                                                    key={list.id}
                                                    onClick={() => addToList(media, list.id)}
                                                >
                                                    Legg til i {list.name}
                                                </DropdownMenuItem>
                                            ))}
                                    </>
                                )}
                            </>
                        )}

                        {memberLists.length > 0 && (
                            <>
                                {(availableEditable.length > 0 || canQuickAdd) && <DropdownMenuSeparator />}
                                <DropdownMenuItem disabled className="text-muted-foreground">
                                    I lister
                                </DropdownMenuItem>
                                {memberLists.map((list) => (
                                    <DropdownMenuItem
                                        key={list.id}
                                        disabled={!canEditList(list.id)}
                                        onClick={() => canEditList(list.id) && removeFromList(media, list.id)}
                                        className={canEditList(list.id) ? "text-red-600" : "text-muted-foreground"}
                                    >
                                        {list.name}
                                        {!canEditList(list.id) && " (kun lesing)"}
                                    </DropdownMenuItem>
                                ))}
                            </>
                        )}

                        {!canQuickAdd && availableEditable.length === 0 && memberLists.length === 0 && (
                            <DropdownMenuItem disabled>Ingen lister tilgjengelig</DropdownMenuItem>
                        )}

                        <DropdownMenuSeparator />
                        <form onSubmit={handleCreateList} className="space-y-2 p-2" onClick={(e) => e.stopPropagation()}>
                            <p className="text-xs font-medium text-muted-foreground">Ny liste</p>
                            <Input
                                placeholder="Listenavn"
                                value={newListName}
                                onChange={(e) => setNewListName(e.target.value)}
                                className="h-8 text-sm"
                            />
                            <Button type="submit" size="sm" className="w-full" disabled={isCreating || !newListName.trim()}>
                                {isCreating ? "Oppretter..." : "Opprett og legg til"}
                            </Button>
                        </form>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
