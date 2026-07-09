"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import {
    deleteList,
    getListsWithStats,
    ListWithStats,
    shareList,
    updateList,
} from "@/lib/listRepository";
import { useSupabase } from "@/components/SupabaseProvider";
import { useListActions } from "@/contexts/ListActionsContext";
import { List, PlusCircle, Share2, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Skeleton } from "../ui/skeleton";
import { ListCard } from "./ListCard";

const UNDO_DELETE_MS = 5000;

type PendingListDelete = {
    list: ListWithStats;
    timeoutId: ReturnType<typeof setTimeout>;
    toastDismiss: () => void;
};

export default function Lists() {
    const [lists, setLists] = useState<{ owned: ListWithStats[]; shared: ListWithStats[] }>({
        owned: [],
        shared: [],
    });
    const [newListName, setNewListName] = useState("");
    const [editListName, setEditListName] = useState("");
    const [editListId, setEditListId] = useState<string | null>(null);
    const [shareEmail, setShareEmail] = useState("");
    const [shareListName, setShareListName] = useState("");
    const [selectedList, setSelectedList] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
    const [listToDelete, setListToDelete] = useState<{ id: string; name: string } | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const { supabase, user } = useSupabase();
    const { createList, refreshLists } = useListActions();
    const pendingDeleteRef = useRef<PendingListDelete | null>(null);
    const displayName = user?.user_metadata?.display_name as string | undefined;

    const fetchLists = useCallback(async () => {
        if (!user) return;

        try {
            const result = await getListsWithStats(supabase, user.id);
            setLists(result);
        } catch (error) {
            console.error("Error fetching lists:", error);
            toast({
                title: "Kunne ikke hente lister",
                description: "Prøv å laste siden på nytt",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [supabase, user]);

    useEffect(() => {
        fetchLists();
    }, [fetchLists]);

    useEffect(() => {
        return () => {
            const pending = pendingDeleteRef.current;
            if (!pending) return;
            clearTimeout(pending.timeoutId);
            void deleteList(supabase, pending.list.id).then(() => refreshLists({ silent: true }));
        };
    }, [supabase, refreshLists]);

    const flushPendingDelete = useCallback(async () => {
        const pending = pendingDeleteRef.current;
        if (!pending) return;

        clearTimeout(pending.timeoutId);
        pendingDeleteRef.current = null;
        pending.toastDismiss();

        try {
            await deleteList(supabase, pending.list.id);
            await refreshLists({ silent: true });
        } catch (error) {
            console.error("Error deleting list:", error);
            setLists((prev) => ({
                ...prev,
                owned: [pending.list, ...prev.owned],
            }));
            toast({
                title: "Kunne ikke slette liste",
                variant: "destructive",
            });
        }
    }, [supabase, refreshLists]);

    const stats = useMemo(() => {
        const totalItems = [...lists.owned, ...lists.shared].reduce((sum, list) => sum + list.itemCount, 0);
        const totalSharedWith = lists.owned.reduce((sum, list) => sum + (list.sharedCount ?? 0), 0);
        return {
            ownedCount: lists.owned.length,
            sharedCount: lists.shared.length,
            totalItems,
            totalSharedWith,
        };
    }, [lists]);

    const handleCreateList = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        try {
            const created = await createList(newListName);
            if (!created) return;

            toast({
                title: "Lista er opprettet",
                description: `"${newListName}" er klar — legg til filmer fra Utforsk eller Min liste`,
                className: "bg-green-700 text-white",
            });
            setNewListName("");
            setIsCreateDialogOpen(false);
            await fetchLists();
        } catch (error) {
            console.error("Error creating list:", error);
            toast({
                title: "Kunne ikke opprette liste",
                description: "Det oppstod en feil ved å opprette lista",
                variant: "destructive",
            });
        }
    };

    const handleEditList = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editListId) return;

        try {
            await updateList(supabase, editListId, editListName);
            toast({
                title: "Navn oppdatert",
                description: `Listen heter nå "${editListName}"`,
                className: "bg-green-700 text-white",
            });
            setEditListName("");
            setEditListId(null);
            setIsEditDialogOpen(false);
            await fetchLists();
            await refreshLists({ silent: true });
        } catch (error) {
            console.error("Error updating list:", error);
            toast({
                title: "Kunne ikke oppdatere liste",
                variant: "destructive",
            });
        }
    };

    const handleDeleteList = (listToDelete: { id: string; name: string }) => {
        const listSnapshot = lists.owned.find((list) => list.id === listToDelete.id);
        if (!listSnapshot) return;

        if (pendingDeleteRef.current) {
            void flushPendingDelete();
        }

        setLists((prev) => ({
            ...prev,
            owned: prev.owned.filter((list) => list.id !== listToDelete.id),
        }));

        const undoDelete = () => {
            const pending = pendingDeleteRef.current;
            if (!pending || pending.list.id !== listSnapshot.id) return;

            clearTimeout(pending.timeoutId);
            pendingDeleteRef.current = null;
            setLists((prev) => ({
                ...prev,
                owned: [pending.list, ...prev.owned],
            }));
            pending.toastDismiss();
            toast({
                title: "Sletting angret",
                description: `"${pending.list.name}" er tilbake`,
            });
        };

        const { dismiss } = toast({
            title: "Lista ble slettet",
            description: `"${listSnapshot.name}" er fjernet`,
            duration: UNDO_DELETE_MS + 1000,
            action: (
                <ToastAction altText="Angre sletting av liste" onClick={undoDelete}>
                    Angre
                </ToastAction>
            ),
        });

        const timeoutId = setTimeout(() => {
            if (pendingDeleteRef.current?.list.id !== listSnapshot.id) return;

            pendingDeleteRef.current = null;
            dismiss();

            void (async () => {
                try {
                    await deleteList(supabase, listSnapshot.id);
                    await refreshLists({ silent: true });
                } catch (error) {
                    console.error("Error deleting list:", error);
                    setLists((prev) => ({
                        ...prev,
                        owned: [listSnapshot, ...prev.owned],
                    }));
                    toast({
                        title: "Kunne ikke slette liste",
                        variant: "destructive",
                    });
                }
            })();
        }, UNDO_DELETE_MS);

        pendingDeleteRef.current = {
            list: listSnapshot,
            timeoutId,
            toastDismiss: dismiss,
        };

        setIsDeleteDialogOpen(false);
        setListToDelete(null);
    };

    const handleShareList = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedList) return;

        try {
            await shareList(supabase, { listId: selectedList, email: shareEmail });
            toast({
                title: "Lista ble delt!",
                description: `${shareListName} er nå delt med ${shareEmail}`,
                className: "bg-green-700 text-white",
            });
            setShareEmail("");
            setSelectedList(null);
            setShareListName("");
            setIsShareDialogOpen(false);
            await fetchLists();
            await refreshLists({ silent: true });
        } catch (error) {
            if (error instanceof Error && error.message === "USER_NOT_FOUND") {
                toast({
                    title: "Fant ikke bruker",
                    description: "Ingen bruker er registrert med denne e-posten",
                    variant: "destructive",
                });
                return;
            }
            if (error instanceof Error && error.message === "ALREADY_SHARED") {
                toast({
                    title: "Allerede delt",
                    description: "Denne lista er allerede delt med denne brukeren",
                });
                return;
            }
            console.error("Error sharing list:", error);
            toast({
                title: "Kunne ikke dele",
                variant: "destructive",
            });
        }
    };

    const openEdit = (list: ListWithStats) => {
        setEditListId(list.id);
        setEditListName(list.name);
        setIsEditDialogOpen(true);
    };

    const openShare = (list: ListWithStats) => {
        setSelectedList(list.id);
        setShareListName(list.name);
        setIsShareDialogOpen(true);
    };

    const openDelete = (list: ListWithStats) => {
        setListToDelete({ id: list.id, name: list.name });
        setIsDeleteDialogOpen(true);
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-muted-foreground">
                        {displayName ? `Hei, ${displayName}!` : "Organiser filmene og seriene dine"}
                    </p>
                    {!loading && (
                        <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                                <List className="h-4 w-4" />
                                {stats.ownedCount} {stats.ownedCount === 1 ? "liste" : "lister"}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Share2 className="h-4 w-4" />
                                {stats.totalItems} titler totalt
                            </span>
                            {stats.sharedCount > 0 && (
                                <span className="flex items-center gap-1.5">
                                    <Users className="h-4 w-4" />
                                    {stats.sharedCount} delt med deg
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 bg-filmlista-primary text-white hover:bg-filmlista-primary/80">
                            <PlusCircle className="h-4 w-4" />
                            Ny liste
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Opprett ny liste</DialogTitle>
                            <DialogDescription>
                                Gi listen et navn. Du kan legge til filmer og serier fra Utforsk eller Min liste.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateList} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Listenavn</Label>
                                <Input
                                    id="name"
                                    value={newListName}
                                    onChange={(e) => setNewListName(e.target.value)}
                                    placeholder="F.eks. Filmkveld med venner"
                                    autoFocus
                                />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={!newListName.trim()} className="bg-filmlista-primary hover:bg-filmlista-primary/80">
                                    Opprett liste
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Tabs defaultValue="owned">
                <TabsList>
                    <TabsTrigger value="owned">Mine lister ({lists.owned.length})</TabsTrigger>
                    <TabsTrigger value="shared">Delt med meg ({lists.shared.length})</TabsTrigger>
                </TabsList>

                {loading ? (
                    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <Skeleton className="h-64 w-full" />
                        <Skeleton className="h-64 w-full" />
                        <Skeleton className="h-64 w-full" />
                    </div>
                ) : (
                    <>
                        <TabsContent value="owned" className="mt-6">
                            {lists.owned.length === 0 ? (
                                <div className="flex flex-col items-center rounded-2xl border border-dashed py-16 text-center">
                                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-filmlista-primary/10 text-filmlista-primary">
                                        <List className="h-7 w-7 shrink-0" strokeWidth={1.75} />
                                    </div>
                                    <h3 className="font-heading text-lg font-semibold">Ingen lister ennå</h3>
                                    <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                                        Opprett en liste for å samle filmer og serier du vil se — alene eller sammen med
                                        andre.
                                    </p>
                                    <Button className="mt-6 bg-filmlista-primary hover:bg-filmlista-primary/80" onClick={() => setIsCreateDialogOpen(true)}>
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Opprett din første liste
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {lists.owned.map((list) => (
                                        <ListCard
                                            key={list.id}
                                            list={list}
                                            variant="owned"
                                            onEdit={openEdit}
                                            onShare={openShare}
                                            onDelete={openDelete}
                                        />
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="shared" className="mt-6">
                            {lists.shared.length === 0 ? (
                                <div className="flex flex-col items-center rounded-2xl border border-dashed py-16 text-center">
                                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-filmlista-primary/10 text-filmlista-primary">
                                        <Users className="h-7 w-7 shrink-0" strokeWidth={1.75} />
                                    </div>
                                    <h3 className="font-heading text-lg font-semibold">Ingen delte lister</h3>
                                    <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                                        Når noen deler en liste med deg, dukker den opp her.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {lists.shared.map((list) => (
                                        <ListCard key={list.id} list={list} variant="shared" />
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </>
                )}
            </Tabs>

            <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Del «{shareListName}»</DialogTitle>
                        <DialogDescription>
                            Skriv inn e-posten til en Filmlista-bruker. De får tilgang til å se og redigere listen.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleShareList} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="shareEmail">E-post</Label>
                            <Input
                                id="shareEmail"
                                type="email"
                                value={shareEmail}
                                onChange={(e) => setShareEmail(e.target.value)}
                                placeholder="venn@eksempel.no"
                                required
                            />
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={!shareEmail.trim()} className="bg-filmlista-primary hover:bg-filmlista-primary/80">
                                Del liste
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Endre navn</DialogTitle>
                        <DialogDescription>Gi listen et nytt navn.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEditList} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="editName">Listenavn</Label>
                            <Input
                                id="editName"
                                value={editListName}
                                onChange={(e) => setEditListName(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={!editListName.trim()} className="bg-filmlista-primary hover:bg-filmlista-primary/80 text-white">
                                Lagre
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="rounded">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Slett «{listToDelete?.name}»?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Alle filmer og serier i listen fjernes permanent. Denne handlingen kan ikke angres.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-full" onClick={() => setListToDelete(null)}>
                            Avbryt
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className="rounded-full bg-red-600 text-white hover:bg-red-700"
                            onClick={() => listToDelete && handleDeleteList(listToDelete)}
                        >
                            Slett liste
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
