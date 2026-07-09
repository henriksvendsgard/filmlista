"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { MediaRef, useListActions } from "@/contexts/ListActionsContext";
import { cn } from "@/lib/utils";
import {
    Bookmark,
    BookmarkCheck,
    BookmarkPlus,
    ChevronRight,
    ListPlus,
    Loader2,
    Lock,
    Plus,
    Users,
} from "lucide-react";
import { useEffect, useState } from "react";

interface ListMembershipPanelProps {
    media: MediaRef;
}

interface ListToggleRowProps {
    name: string;
    isMember: boolean;
    isPending: boolean;
    onToggle: () => void;
    shared?: boolean;
}

function ListToggleRow({ name, isMember, isPending, onToggle, shared }: ListToggleRowProps) {
    return (
        <button
            type="button"
            disabled={isPending}
            onClick={onToggle}
            className={cn(
                "group relative flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left text-sm transition-all duration-200",
                isMember
                    ? "border-filmlista-primary/50 bg-filmlista-primary/10 shadow-[inset_0_0_0_1px_rgba(82,77,239,0.08)]"
                    : "border-border/80 bg-background/60 hover:border-filmlista-primary/30 hover:bg-filmlista-primary/5",
                isPending && "opacity-70"
            )}
        >
            <span
                className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors duration-200",
                    isMember
                        ? "bg-filmlista-primary text-white shadow-sm"
                        : "bg-muted text-muted-foreground group-hover:bg-filmlista-primary/15 group-hover:text-filmlista-primary"
                )}
            >
                {isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : isMember ? (
                    <BookmarkCheck className="h-3.5 w-3.5" />
                ) : (
                    <Bookmark className="h-3.5 w-3.5" />
                )}
            </span>

            <span className={cn("min-w-0 flex-1 truncate", isMember && "font-medium")}>{name}</span>

            {shared && (
                <Users className="h-3 w-3 shrink-0 text-muted-foreground/80" aria-label="Delt liste" />
            )}
        </button>
    );
}

function ListMembershipPanelSkeleton() {
    return <Skeleton className="h-10 w-full max-w-xs rounded-lg" />;
}

interface ListMembershipDialogBodyProps {
    memberListIds: string[];
    memberCount: number;
    canQuickAdd: boolean;
    lastUsedName: string | null;
    hasAnyLists: boolean;
    pendingListId: string | null;
    showCreateForm: boolean;
    newListName: string;
    isCreating: boolean;
    lists: { owned: { id: string; name: string }[] };
    editableShared: { id: string; name: string }[];
    readOnlyShared: { id: string; name: string }[];
    onToggle: (listId: string, isCurrentlyMember: boolean) => void;
    onQuickAdd: () => void;
    onCreateList: (e: React.FormEvent) => void;
    onNewListNameChange: (value: string) => void;
    onShowCreateForm: (show: boolean) => void;
}

function ListMembershipDialogBody({
    memberListIds,
    memberCount,
    canQuickAdd,
    lastUsedName,
    hasAnyLists,
    pendingListId,
    showCreateForm,
    newListName,
    isCreating,
    lists,
    editableShared,
    readOnlyShared,
    onToggle,
    onQuickAdd,
    onCreateList,
    onNewListNameChange,
    onShowCreateForm,
}: ListMembershipDialogBodyProps) {
    return (
        <div className="space-y-3">
            {canQuickAdd && (
                <Button
                    className="h-9 w-full bg-filmlista-primary shadow-sm hover:bg-filmlista-hover"
                    size="sm"
                    onClick={onQuickAdd}
                >
                    <BookmarkPlus className="mr-2 h-4 w-4" />
                    Legg til i {lastUsedName}
                </Button>
            )}

            {!hasAnyLists && memberCount === 0 && (
                <div className="rounded-lg border border-dashed border-filmlista-primary/25 bg-muted/30 px-3 py-4 text-center">
                    <Bookmark className="mx-auto mb-2 h-5 w-5 text-filmlista-primary/60" />
                    <p className="text-sm text-muted-foreground">
                        Opprett din første liste for å samle filmer og serier.
                    </p>
                </div>
            )}

            {(lists.owned.length > 0 || editableShared.length > 0 || readOnlyShared.length > 0) && (
                <div className="max-h-64 space-y-3 overflow-y-auto pr-0.5 scrollbar-thin [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-filmlista-primary/20">
                    {lists.owned.length > 0 && (
                        <div className="space-y-1.5">
                            {(editableShared.length > 0 || readOnlyShared.length > 0) && (
                                <p className="px-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                                    Dine lister
                                </p>
                            )}
                            {lists.owned.map((list) => (
                                <ListToggleRow
                                    key={list.id}
                                    name={list.name}
                                    isMember={memberListIds.includes(list.id)}
                                    isPending={pendingListId === list.id}
                                    onToggle={() => onToggle(list.id, memberListIds.includes(list.id))}
                                />
                            ))}
                        </div>
                    )}

                    {editableShared.length > 0 && (
                        <div className="space-y-1.5">
                            <p className="px-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                                Delte lister
                            </p>
                            {editableShared.map((list) => (
                                <ListToggleRow
                                    key={list.id}
                                    name={list.name}
                                    shared
                                    isMember={memberListIds.includes(list.id)}
                                    isPending={pendingListId === list.id}
                                    onToggle={() => onToggle(list.id, memberListIds.includes(list.id))}
                                />
                            ))}
                        </div>
                    )}

                    {readOnlyShared.length > 0 && (
                        <div className="space-y-1.5">
                            <p className="px-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                                Kun lesing
                            </p>
                            {readOnlyShared.map((list) => {
                                const isMember = memberListIds.includes(list.id);
                                return (
                                    <div
                                        key={list.id}
                                        className={cn(
                                            "flex items-center gap-2.5 rounded-lg border border-dashed px-2.5 py-2 text-sm",
                                            isMember
                                                ? "border-muted-foreground/25 bg-muted/40"
                                                : "border-border/50 opacity-60"
                                        )}
                                    >
                                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                                            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                                        </span>
                                        <span className="min-w-0 flex-1 truncate">{list.name}</span>
                                        {isMember && (
                                            <BookmarkCheck className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            <div
                className={cn(
                    showCreateForm
                        ? "rounded-lg border border-filmlista-primary/20 bg-muted/30 p-3"
                        : "border-t border-border/60 pt-3"
                )}
            >
                {showCreateForm ? (
                    <form onSubmit={onCreateList} className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Ny liste</p>
                        <Input
                            id="new-list-name"
                            placeholder="F.eks. Må se, Komedier..."
                            value={newListName}
                            onChange={(e) => onNewListNameChange(e.target.value)}
                            className="h-9 border-filmlista-primary/20 bg-background text-sm focus-visible:ring-filmlista-primary/30"
                            autoFocus
                        />
                        <div className="flex gap-1.5">
                            <Button
                                type="submit"
                                size="sm"
                                className="h-8 flex-1 bg-filmlista-primary hover:bg-filmlista-hover"
                                disabled={isCreating || !newListName.trim()}
                            >
                                {isCreating ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    "Opprett og legg til"
                                )}
                            </Button>
                            {hasAnyLists && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-2"
                                    onClick={() => {
                                        onShowCreateForm(false);
                                        onNewListNameChange("");
                                    }}
                                >
                                    Avbryt
                                </Button>
                            )}
                        </div>
                    </form>
                ) : (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-full justify-center gap-1.5 text-xs text-muted-foreground hover:bg-filmlista-primary/10 hover:text-filmlista-primary"
                        onClick={() => onShowCreateForm(true)}
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Opprett ny liste
                    </Button>
                )}
            </div>
        </div>
    );
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

    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [pendingListId, setPendingListId] = useState<string | null>(null);
    const [newListName, setNewListName] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);

    const memberListIds = getMediaListIds(media.mediaId, media.mediaType);
    const memberCount = memberListIds.length;
    const lastUsedName = lastUsedListId ? getListName(lastUsedListId) : null;
    const canQuickAdd =
        lastUsedListId &&
        lastUsedName &&
        canEditList(lastUsedListId) &&
        !memberListIds.includes(lastUsedListId);

    const hasEditableLists = lists.owned.length > 0 || editableShared.length > 0;
    const hasAnyLists = hasEditableLists || readOnlyShared.length > 0;

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

    useEffect(() => {
        if (!hasAnyLists && !isLoading && isOpen) {
            setShowCreateForm(true);
        }
    }, [hasAnyLists, isLoading, isOpen]);

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open) {
            setShowCreateForm(false);
            setNewListName("");
        }
    };

    const handleToggle = async (listId: string, isCurrentlyMember: boolean) => {
        setPendingListId(listId);
        await toggleListMembership(media, listId, isCurrentlyMember);
        setPendingListId(null);
    };

    const handleCreateList = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newListName.trim()) return;
        setIsCreating(true);
        await createListAndAdd(newListName.trim(), media);
        setNewListName("");
        setIsCreating(false);
        setShowCreateForm(false);
    };

    if (isLoading) {
        return <ListMembershipPanelSkeleton />;
    }

    const membershipLabel =
        memberCount === 0
            ? "Ikke lagt til"
            : memberCount === 1
              ? "1 liste"
              : `${memberCount} lister`;

    const memberNames = [...lists.owned, ...lists.shared, ...readOnlyShared]
        .filter((list) => memberListIds.includes(list.id))
        .map((list) => list.name);

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "h-10 gap-2 border-filmlista-primary/25 bg-linear-to-r from-filmlista-primary/5 to-transparent pr-3 hover:border-filmlista-primary/40 hover:bg-filmlista-primary/10",
                        memberCount > 0 && "border-filmlista-primary/40"
                    )}
                >
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-filmlista-primary/15 text-filmlista-primary">
                        <ListPlus className="h-4 w-4" />
                    </span>
                    <span className="flex min-w-0 flex-col items-start text-left">
                        <span className="text-sm font-medium leading-tight">
                            {hasAnyLists ? "Mine lister" : "Opprett liste"}
                        </span>
                        {memberCount > 0 && memberNames.length > 0 ? (
                            <span className="max-w-40 truncate text-xs text-muted-foreground">
                                {memberNames.join(", ")}
                            </span>
                        ) : (
                            <span className="text-xs text-muted-foreground">{membershipLabel}</span>
                        )}
                    </span>
                    <Badge
                        variant="outline"
                        className={cn(
                            "ml-1 shrink-0 text-[10px]",
                            memberCount > 0 &&
                                "border-filmlista-primary/40 bg-filmlista-primary/10 text-filmlista-primary"
                        )}
                    >
                        {memberCount}
                    </Badge>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Button>
            </DialogTrigger>

            <DialogContent className="max-w-md gap-0 p-0 sm:rounded-xl">
                <DialogHeader className="border-b px-5 py-4 text-left">
                    <DialogTitle>Legg til i liste</DialogTitle>
                    <DialogDescription>Velg hvilke lister denne tittelen skal ligge i.</DialogDescription>
                </DialogHeader>

                <div className="px-5 py-4">
                    <ListMembershipDialogBody
                        memberListIds={memberListIds}
                        memberCount={memberCount}
                        canQuickAdd={!!canQuickAdd}
                        lastUsedName={lastUsedName ?? null}
                        hasAnyLists={hasAnyLists}
                        pendingListId={pendingListId}
                        showCreateForm={showCreateForm}
                        newListName={newListName}
                        isCreating={isCreating}
                        lists={lists}
                        editableShared={editableShared}
                        readOnlyShared={readOnlyShared}
                        onToggle={handleToggle}
                        onQuickAdd={() => addToLastUsedList(media)}
                        onCreateList={handleCreateList}
                        onNewListNameChange={setNewListName}
                        onShowCreateForm={setShowCreateForm}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
