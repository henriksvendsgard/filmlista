"use client";

import { useSupabase } from "@/components/SupabaseProvider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";
import { PencilIcon } from "lucide-react";
import React, { useEffect, useState } from "react";

interface CustomUser extends User {
    display_name?: string;
}

export default function Profile() {
    const { supabase } = useSupabase();
    const [displayName, setDisplayName] = useState("");
    const [message, setMessage] = useState("");
    const [user, setUser] = useState<CustomUser | null>(null);

    const [tempDisplayName, setTempDisplayName] = useState("");
    const [editingDisplayName, setEditingDisplayName] = useState(false);
    useEffect(() => {
        const fetchUserProfile = async () => {
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();
            if (userError) {
                console.error("Error fetching user:", userError);
                return;
            }
            if (user) {
                const displayName = user.user_metadata?.display_name;
                setUser({ ...user, display_name: displayName });
            }
        };
        fetchUserProfile();
    }, [supabase]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();
        if (userError) {
            console.error("Error fetching user:", userError);
            return;
        }
        if (!user) return;

        // First update the user metadata
        const { error: updateError } = await supabase.auth.updateUser({
            data: { display_name: displayName },
        });

        if (updateError) {
            setMessage("Feil ved oppdatering av brukerdata");
            return;
        }

        if (/[^a-zA-Z]/.test(displayName)) {
            toast({
                title: "Feil ved oppdatering av visningsnavn",
                description: "Visningsnavn kan ikke inneholde spesialtegn",
                variant: "destructive",
            });
            return;
        }

        // Then update the profiles table
        const { error: profileError } = await supabase
            .from("profiles")
            .update({ displayname: displayName })
            .eq("id", user.id);

        if (profileError) {
            setMessage("Feil ved oppdatering av visningsnavn");
            // Don't return here, as the metadata was already updated
            console.error("Error updating profile:", profileError);
        }

        toast({
            title: "Visningsnavn oppdatert",
            description: `visningsnavnet ditt er nå "${displayName}"`,
            variant: "default",
            className: "bg-green-800 text-white",
        });
        setTempDisplayName(displayName);
        setEditingDisplayName(false);
    };

    return (
        <div className="container px-5">
            <Card className="mx-auto mt-10 w-full max-w-lg rounded-lg p-6 shadow-md">
                <h1 className="mb-4 text-2xl font-bold">Din profil</h1>
                <strong className="mb-4">E-post: </strong>
                <p className="mb-4 mt-4">{user?.email}</p>
                <div>
                    <strong className="mb-4">Visningsnavn: </strong>
                    {!editingDisplayName ? (
                        <div className="mt-4 flex items-center gap-2">
                            <p>{tempDisplayName ? tempDisplayName : user?.display_name}</p>
                            {user?.display_name && (
                                <Button variant="outline" size={"icon"} onClick={() => setEditingDisplayName(true)}>
                                    <PencilIcon className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    ) : (
                        <form onSubmit={handleUpdate} className="mt-4 space-y-4">
                            <Input
                                type="text"
                                placeholder={user?.display_name ? user?.display_name : "Visningsnavn"}
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                required
                                className="w-full max-w-72 rounded border border-gray-300 p-2 text-base"
                                autoFocus
                            />
                            <div>
                                <Button
                                    variant="outline"
                                    type="button"
                                    onClick={() => {
                                        setEditingDisplayName(false);
                                        setDisplayName(tempDisplayName);
                                    }}
                                    className="mr-2"
                                >
                                    Avbryt
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={!displayName}
                                    className="rounded bg-blue-800 py-2 text-white hover:bg-blue-900"
                                >
                                    Endre
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
                {message && <p className="mt-4 text-red-500">{message}</p>}
            </Card>
        </div>
    );
}
