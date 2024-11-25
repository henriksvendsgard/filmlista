"use client";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { User, createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { PlusCircle, Share2, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Skeleton } from "../ui/skeleton";

interface List {
	id: string;
	name: string;
	owner_id: string;
	created_at: string;
	owner_email: string;
}

interface ListsState {
	owned: List[];
	shared: List[];
}

export default function Lists() {
	const [lists, setLists] = useState<ListsState>({ owned: [], shared: [] });
	const [user, setUser] = useState<User | null>(null);
	const [newListName, setNewListName] = useState("");
	const [shareEmail, setShareEmail] = useState("");
	const [selectedList, setSelectedList] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
	const [listToDelete, setListToDelete] = useState<{ id: string; name: string } | null>(null);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

	const supabase = createClientComponentClient();

	const fetchLists = useCallback(async () => {
		const {
			data: { user },
		} = await supabase.auth.getUser();
		setUser(user);
		if (!user) return;

		try {
			// Hent alle delte lister for denne brukeren
			const { data: sharedListIds, error: sharedError } = await supabase.from("shared_lists").select("list_id").eq("user_id", user.id);

			if (sharedError) throw sharedError;

			// Hent alle lister
			const { data: allLists, error: listsError } = await supabase.from("lists").select("*");

			if (listsError) throw listsError;

			// Filtrer lister inn i owned og shared
			const sharedListIdsArray = (sharedListIds || []).map((item) => item.list_id);

			const ownedLists = allLists.filter((list) => list.owner_id === user.id);
			const sharedLists = allLists.filter((list) => sharedListIdsArray.includes(list.id));

			setLists({
				owned: ownedLists || [],
				shared: sharedLists || [],
			});
		} catch (error) {
			console.error("Error fetching lists:", error);
			toast({
				title: "Error",
				description: "Failed to fetch lists",
				variant: "destructive",
			});
		}
		setLoading(false);
	}, [supabase]);

	useEffect(() => {
		fetchLists();
	}, [fetchLists]);

	const handleCreateList = async (e: React.FormEvent) => {
		e.preventDefault();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) return;

		try {
			const { data, error } = await supabase
				.from("lists")
				.insert([{ name: newListName, owner_id: user.id }])
				.select()
				.single();

			if (error) throw error;

			toast({
				title: "Lista er opprettet",
				description: `Lista "${newListName}" er opprettet, du kan nå legge til filmer i den`,
				className: "bg-green-700",
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

	const handleDeleteList = () => {
		if (!listToDelete) return;

		const deleteList = async () => {
			try {
				const { error: moviesError } = await supabase.from("list_movies").delete().eq("list_id", listToDelete.id);

				if (moviesError) throw moviesError;

				const { error: sharedError } = await supabase.from("shared_lists").delete().eq("list_id", listToDelete.id);

				if (sharedError) throw sharedError;

				const { error: listError } = await supabase.from("lists").delete().eq("id", listToDelete.id);

				if (listError) throw listError;

				setLists((prev) => ({
					...prev,
					owned: prev.owned.filter((list) => list.id !== listToDelete.id),
				}));

				toast({
					title: "Lista ble slettet",
					description: `Lista "${listToDelete.name}" har nå blitt slettet`,
					variant: "destructive",
				});
			} catch (error) {
				console.error("Error deleting list:", error);
				toast({
					title: "Noe gikk galt...",
					description: "Kunne ikke slette lista",
					variant: "destructive",
				});
			} finally {
				setIsDeleteDialogOpen(false);
				setListToDelete(null);
			}
		};

		deleteList();
	};

	const handleShareList = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedList) return;

		try {
			// Hent brukerens ID fra e-posten ved å bruke profiles-tabellen
			const { data: userData, error: userError } = await supabase
				.from("profiles") // profiles-tabellen er en del av Supabase Auth
				.select("id")
				.eq("email", shareEmail)
				.single();

			if (userError || !userData) {
				toast({
					title: "Noe gikk galt...",
					description: "Fant ikke brukeren med denne e-posten!",
					variant: "destructive",
				});
				return;
			}

			// Sjekker om lista er delt med brukeren allerede
			const { data: existingShare, error: existingError } = await supabase.from("shared_lists").select("*").eq("list_id", selectedList).eq("user_id", userData.id).single();

			if (existingShare) {
				toast({
					title: "Allerede delt",
					description: "Denne lista er allerede delt med denne brukeren",
					variant: "default",
					className: "bg-yellow-600",
				});
				return;
			}

			const { error } = await supabase.from("shared_lists").insert([{ list_id: selectedList, user_id: userData.id }]);

			if (error) throw error;

			toast({
				title: "Lista ble delt!",
				description: `Lista er nå delt med ${shareEmail}`,
				className: "bg-green-700",
			});
			setShareEmail("");
			setSelectedList(null);
			setIsShareDialogOpen(false);
			fetchLists();
		} catch (error) {
			console.error("Error sharing list:", error);
			toast({
				title: "Kunne ikke dele",
				description: "Det oppstod en feil ved å dele lista",
				variant: "destructive",
			});
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h2 className="text-3xl font-bold tracking-tight">Lister for {`"${user?.email}"`}</h2>
				<Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
					<DialogTrigger asChild>
						<Button>
							<PlusCircle className="mr-2 h-4 w-4" />
							Ny liste
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader className="mb-8">
							<DialogTitle className="mb-4">Opprett ny liste</DialogTitle>
							<DialogDescription>Gi listen din et navn. Filmer legger du til senere.</DialogDescription>
						</DialogHeader>
						<div className="space-y-8">
							<div>
								<Label className="hidden" htmlFor="name">
									Listenavn
								</Label>
								<Input className="text-base" id="name" value={newListName} onChange={(e) => setNewListName(e.target.value)} placeholder="F.eks. Favorittfilmer" />
							</div>
							<DialogFooter>
								<Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
									Avbryt
								</Button>
								<Button className="mb-4" onClick={handleCreateList} disabled={!newListName.trim()}>
									Opprett liste
								</Button>
							</DialogFooter>
						</div>
					</DialogContent>
				</Dialog>
			</div>

			<Tabs defaultValue="owned" className="w-full">
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger value="owned">Mine lister</TabsTrigger>
					<TabsTrigger value="shared">Delt med meg</TabsTrigger>
				</TabsList>

				{loading && (
					<TabsContent value="owned" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 sm:mt-16">
						<Skeleton className="w-full h-[115px]" />
						<Skeleton className="w-full h-[115px]" />
					</TabsContent>
				)}
				<TabsContent value="owned">
					{!loading && lists.owned.length === 0 && lists.shared.length === 0 && (
						<div className="flex justify-center items-center h-24">
							<p className="text-muted-foreground">Du har ingen lister enda, trykk på Ny liste for å lage filmlista di!</p>
						</div>
					)}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 sm:mt-16">
						{lists.owned.map((list: List) => (
							<Card key={list.id}>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="text-lg font-bold">{list.name}</CardTitle>
									<div className="flex space-x-2">
										<Button
											variant="ghost"
											size="icon"
											onClick={() => {
												setSelectedList(list.id);
												setIsShareDialogOpen(true);
											}}
										>
											<Share2 className="h-4 w-4" />
										</Button>
										<Button
											variant="destructive"
											size="icon"
											onClick={() => {
												setListToDelete({ id: list.id, name: list.name });
												setIsDeleteDialogOpen(true);
											}}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</CardHeader>
								<CardContent>
									<p className="text-sm text-muted-foreground">Opprettet: {new Date(list.created_at).toLocaleDateString()}</p>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>

				<TabsContent value="shared">
					{!loading && lists.shared.length === 0 && (
						<div className="flex justify-center items-center h-24">
							<p className="text-muted-foreground">Ingen har delt noen lister med deg enda...</p>
						</div>
					)}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 sm:mt-16">
						{lists.shared.map((list: any) => (
							<Card key={list.id}>
								<CardHeader>
									<CardTitle className="text-lg font-bold">{list.name}</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-sm text-muted-foreground">Opprettet: {new Date(list.created_at).toLocaleDateString()}</p>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>
			</Tabs>

			<Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Del listen din med andre brukere</DialogTitle>
					</DialogHeader>
					<form onSubmit={handleShareList} className="space-y-4">
						<Input type="email" value={shareEmail} onChange={(e) => setShareEmail(e.target.value)} placeholder="Brukerens e-post" required />
						<Button type="submit" className="w-full">
							Del liste
						</Button>
					</form>
				</DialogContent>
			</Dialog>

			<AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Er du sikker?</AlertDialogTitle>
						<AlertDialogDescription>Dette vil slette {listToDelete?.name} og fjerne alle filmene fra listen. Denne handlingen kan ikke angres.</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel
							onClick={() => {
								setIsDeleteDialogOpen(false);
								setListToDelete(null);
							}}
						>
							Avbryt
						</AlertDialogCancel>
						<AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDeleteList}>
							Slett
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
