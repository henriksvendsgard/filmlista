"use client";
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
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { PlusCircle, Share2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export default function Lists() {
  const [lists, setLists] = useState<any>({ owned: [], shared: [] });
  const [newListName, setNewListName] = useState("");
  const [shareEmail, setShareEmail] = useState("");
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  
  const supabase = createClientComponentClient();

  const fetchLists = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // First get all shared_lists for this user
      const { data: sharedListIds, error: sharedError } = await supabase
        .from('shared_lists')
        .select('list_id')
        .eq('user_id', user.id);

      if (sharedError) throw sharedError;

      // Get all relevant lists
      const { data: allLists, error: listsError } = await supabase
        .from('lists')
        .select('*');

      if (listsError) throw listsError;

      // Filter lists into owned and shared
      const sharedListIdsArray = (sharedListIds || []).map(item => item.list_id);
      
      const ownedLists = allLists.filter(list => list.owner_id === user.id);
      const sharedLists = allLists.filter(list => sharedListIdsArray.includes(list.id));

      setLists({
        owned: ownedLists || [],
        shared: sharedLists || []
      });
    } catch (error) {
      console.error('Error fetching lists:', error);
      toast({
        title: "Error",
        description: "Failed to fetch lists",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLists();
  }, []);

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('lists')
        .insert([{ name: newListName, owner_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Liste opprettet",
        description: "Den nye listen er opprettet",
      });
      setNewListName("");
      setIsCreateDialogOpen(false);
      fetchLists();
    } catch (error) {
      console.error('Error creating list:', error);
      toast({
        title: "Kunne ikke opprette",
        description: "Det oppstod en feil ved å opprette listen",
        variant: "destructive",
      });
    }
  };

  const handleDeleteList = async (listId: string) => {
    try {
      const { error } = await supabase
        .from('lists')
        .delete()
        .eq('id', listId);

      if (error) throw error;

      toast({
        title: "Liste slettet",
        description: "Listen er nå slettet",
      });
      fetchLists();
    } catch (error) {
      console.error('Error deleting list:', error);
      toast({
        title: "Kunne ikke slette",
        description: "Det oppstod en feil ved å slette listen",
        variant: "destructive",
      });
    }
  };

  const handleShareList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedList) return;

    try {
      // Get user ID from email using the profiles table
      const { data: userData, error: userError } = await supabase
        .from('profiles')  // Make sure you have a profiles table
        .select('id')
        .eq('email', shareEmail)
        .single();

      if (userError || !userData) {
        toast({
          title: "Feil",
          description: "Brukeren ikke funnet",
          variant: "destructive",
        });
        return;
      }

      // Check if the list is already shared with this user
      const { data: existingShare, error: existingError } = await supabase
        .from('shared_lists')
        .select('*')
        .eq('list_id', selectedList)
        .eq('user_id', userData.id)
        .single();

      if (existingShare) {
        toast({
          title: "Allerede delt",
          description: "Denne listen er allerede delt med denne brukeren",
          variant: "default",
        });
        return;
      }

      const { error } = await supabase
        .from('shared_lists')
        .insert([{ list_id: selectedList, user_id: userData.id }]);

      if (error) throw error;

      toast({
        title: "Liste delt",
        description: "Listen er nå delt med den valgte brukeren",
      });
      setShareEmail("");
      setSelectedList(null);
      setIsShareDialogOpen(false);
      fetchLists();
    } catch (error) {
      console.error('Error sharing list:', error);
      toast({
        title: "Kunne ikke dele",
        description: "Det oppstod en feil ved å dele listen",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Dine lister</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Ny liste
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Opprett ny liste</DialogTitle>
              <DialogDescription>
                Gi listen din et navn. Du kan legge til filmer senere.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Listenavn</Label>
                <Input
                  id="name"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="F.eks. Favorittfilmer"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Avbryt
                </Button>
                <Button onClick={handleCreateList} disabled={!newListName.trim()}>
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
        
        <TabsContent value="owned">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 sm:mt-16">
            {lists.owned.map((list: any) => (
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
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteList(list.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Opprettet: {new Date(list.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="shared">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lists.shared.map((list: any) => (
              <Card key={list.id}>
                <CardHeader>
                  <CardTitle className="text-lg font-bold">{list.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Created at: {new Date(list.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share List</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleShareList} className="space-y-4">
            <Input
              type="email"
              value={shareEmail}
              onChange={(e) => setShareEmail(e.target.value)}
              placeholder="User email"
              required
            />
            <Button type="submit" className="w-full">Share</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 