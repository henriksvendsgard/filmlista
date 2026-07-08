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
import {
    createList,
    deleteList,
    getListsWithStats,
    ListWithStats,
    shareList,
    updateList,
} from "@/lib/listRepository";
import { useSupabase } from "@/components/SupabaseProvider";
import { List, PlusCircle, Share2, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Skeleton } from "../ui/skeleton";
import { ListCard } from "./ListCard";

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
            await createList(supabase, { name: newListName, ownerId: user.id });
            toast({
                title: "Lista er opprettet",
                description: `"${newListName}" er klar — legg til filmer fra Utforsk eller Min liste`,
                className: "bg-green-700 text-white",
            });
            setNewListName("");
            setIsCreateDialogOpen(false);
            fetchLists();
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
            fetchLists();
        } catch (error) {
            console.error("Error updating list:", error);
            toast({
                title: "Kunne ikke oppdatere liste",
                variant: "destructive",
            });
        }
    };

    const handleDeleteList = async (listToDelete: { id: string; name: string }) => {
        try {
            await deleteList(supabase, listToDelete.id);
            setLists((prev) => ({
                ...prev,
                owned: prev.owned.filter((list) => list.id !== listToDelete.id),
            }));
            toast({
                title: "Lista ble slettet",
                description: `"${listToDelete.name}" er fjernet`,
            });
        } catch (error) {
            console.error("Error deleting list:", error);
            toast({
                title: "Kunne ikke slette liste",
                variant: "destructive",
            });
        } finally {
            setIsDeleteDialogOpen(false);
            setListToDelete(null);
        }
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
            fetchLists();
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
                                <div className="flex flex-col items-center rounded-lg border border-dashed py-16 text-center">
                                    <List className="mb-4 h-12 w-12 text-muted-foreground/50" />
                                    <h3 className="text-lg font-semibold">Ingen lister ennå</h3>
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
                                <div className="flex flex-col items-center rounded-lg border border-dashed py-16 text-center">
                                    <Users className="mb-4 h-12 w-12 text-muted-foreground/50" />
                                    <h3 className="text-lg font-semibold">Ingen delte lister</h3>
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
                            <Button type="submit" disabled={!editListName.trim()} className="bg-filmlista-primary hover:bg-filmlista-primary/80">
                                Lagre
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Slett «{listToDelete?.name}»?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Alle filmer og serier i listen fjernes permanent. Denne handlingen kan ikke angres.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setListToDelete(null)}>Avbryt</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
