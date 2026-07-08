"use client";

import { StreamingServicesSelector } from "@/components/StreamingServicesSelector/StreamingServicesSelector";
import { useSupabase } from "@/components/SupabaseProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useStreamingServices } from "@/hooks/useStreamingServices";
import { Compass, List, LogOut, PencilIcon, Tv } from "lucide-react";
import Link from "next/link";
import React, { useCallback, useEffect, useRef, useState } from "react";

function getInitials(name: string, email?: string) {
    if (name.trim()) {
        return name
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase())
            .join("");
    }
    return email?.[0]?.toUpperCase() ?? "?";
}

export default function Profile() {
    const { supabase, user } = useSupabase();
    const [displayName, setDisplayName] = useState("");
    const [tempDisplayName, setTempDisplayName] = useState("");
    const [editingDisplayName, setEditingDisplayName] = useState(false);
    const [isSavingName, setIsSavingName] = useState(false);

    const { services, isLoading: isLoadingServices, saveServices } = useStreamingServices();
    const [selectedServices, setSelectedServices] = useState<number[]>([]);
    const [isSavingServices, setIsSavingServices] = useState(false);
    const saveServicesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!user) return;

        const loadProfile = async () => {
            const { data } = await supabase.from("profiles").select("displayname").eq("id", user.id).single();
            const name = data?.displayname || (user.user_metadata?.display_name as string) || "";
            setDisplayName(name);
            setTempDisplayName(name);
        };

        loadProfile();
    }, [supabase, user]);

    useEffect(() => {
        if (!isLoadingServices) {
            setSelectedServices(services);
        }
    }, [services, isLoadingServices]);

    const scheduleSaveServices = useCallback(
        (newServices: number[]) => {
            if (saveServicesTimer.current) clearTimeout(saveServicesTimer.current);
            saveServicesTimer.current = setTimeout(async () => {
                setIsSavingServices(true);
                const success = await saveServices(newServices);
                setIsSavingServices(false);
                if (success) {
                    toast({
                        title: "Strømmetjenester lagret",
                        className: "bg-green-800 text-white",
                    });
                }
            }, 600);
        },
        [saveServices]
    );

    const handleServicesChange = (newServices: number[]) => {
        setSelectedServices(newServices);
        scheduleSaveServices(newServices);
    };

    const handleUpdateName = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (/[^a-zA-ZæøåÆØÅ\s-]/.test(displayName)) {
            toast({
                title: "Ugyldig visningsnavn",
                description: "Visningsnavn kan bare inneholde bokstaver",
                variant: "destructive",
            });
            return;
        }

        setIsSavingName(true);
        const { error: updateError } = await supabase.auth.updateUser({
            data: { display_name: displayName.trim() },
        });

        if (updateError) {
            toast({ title: "Kunne ikke oppdatere navn", variant: "destructive" });
            setIsSavingName(false);
            return;
        }

        const { error: profileError } = await supabase
            .from("profiles")
            .update({ displayname: displayName.trim() })
            .eq("id", user.id);

        setIsSavingName(false);

        if (profileError) {
            toast({ title: "Kunne ikke oppdatere profil", variant: "destructive" });
            return;
        }

        setTempDisplayName(displayName.trim());
        setEditingDisplayName(false);
        toast({
            title: "Visningsnavn oppdatert",
            className: "bg-green-800 text-white",
        });
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
    };

    const startEditing = () => {
        setDisplayName(tempDisplayName);
        setEditingDisplayName(true);
    };

    if (!user) {
        return (
            <div className="container mx-auto px-5 py-16 text-center text-muted-foreground">
                <p>Du må være innlogget for å se profilen din.</p>
                <Button asChild className="mt-4">
                    <Link href="/login">Logg inn</Link>
                </Button>
            </div>
        );
    }

    const memberSince = user.created_at
        ? new Date(user.created_at).toLocaleDateString("nb-NO", { month: "long", year: "numeric" })
        : null;

    return (
        <div className="container mx-auto mb-20 max-w-4xl px-5 lg:px-10">
            <h1 className="mb-8 text-4xl font-bold">Profil</h1>

            <div className="grid gap-6 lg:grid-cols-5">
                <div className="space-y-6 lg:col-span-2">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-filmlista-primary text-xl font-semibold text-white">
                                    {getInitials(tempDisplayName, user.email)}
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-xl font-semibold">
                                        {tempDisplayName || "Sett visningsnavn"}
                                    </p>
                                    <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                                    {memberSince && (
                                        <p className="mt-1 text-xs text-muted-foreground">Medlem siden {memberSince}</p>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6 border-t pt-6">
                                <Label className="text-muted-foreground">Visningsnavn</Label>
                                {!editingDisplayName ? (
                                    <div className="mt-2 flex items-center justify-between gap-2">
                                        <p className="font-medium">{tempDisplayName || "—"}</p>
                                        <Button variant="outline" size="icon" onClick={startEditing}>
                                            <PencilIcon className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleUpdateName} className="mt-2 space-y-3">
                                        <Input
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            placeholder="Ditt navn"
                                            autoFocus
                                            maxLength={30}
                                        />
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setEditingDisplayName(false)}
                                                disabled={isSavingName}
                                            >
                                                Avbryt
                                            </Button>
                                            <Button
                                                type="submit"
                                                disabled={!displayName.trim() || isSavingName}
                                                className="bg-filmlista-primary hover:bg-filmlista-primary/80"
                                            >
                                                {isSavingName ? "Lagrer..." : "Lagre"}
                                            </Button>
                                        </div>
                                    </form>
                                )}
                                <p className="mt-2 text-xs text-muted-foreground">
                                    Vises når du legger til filmer i delte lister.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Snarveier</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-2">
                            <Button variant="outline" className="justify-start gap-2" asChild>
                                <Link href="/">
                                    <Compass className="h-4 w-4" />
                                    Utforsk
                                </Link>
                            </Button>
                            <Button variant="outline" className="justify-start gap-2" asChild>
                                <Link href="/watchlist">
                                    <Tv className="h-4 w-4" />
                                    Min liste
                                </Link>
                            </Button>
                            <Button variant="outline" className="justify-start gap-2" asChild>
                                <Link href="/lists">
                                    <List className="h-4 w-4" />
                                    Dine lister
                                </Link>
                            </Button>
                            <Button
                                variant="outline"
                                className="justify-start gap-2 text-destructive hover:text-destructive"
                                onClick={handleSignOut}
                            >
                                <LogOut className="h-4 w-4" />
                                Logg ut
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Mine strømmetjenester</CardTitle>
                        <CardDescription>
                            Velg tjenestene du abonnerer på. Vi filtrerer filmer og serier du faktisk kan strømme på
                            Utforsk og Min liste.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoadingServices ? (
                            <p className="text-sm text-muted-foreground">Laster tjenester...</p>
                        ) : (
                            <>
                                <StreamingServicesSelector
                                    selected={selectedServices}
                                    onChange={handleServicesChange}
                                    disabled={isSavingServices}
                                />
                                {isSavingServices && (
                                    <p className="mt-4 text-sm text-muted-foreground">Lagrer...</p>
                                )}
                                {selectedServices.length === 0 && !isSavingServices && (
                                    <p className="mt-4 text-sm text-muted-foreground">
                                        Ingen tjenester valgt — aktiver «På mine tjenester»-filteret på Utforsk når du
                                        har lagt til minst én.
                                    </p>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
