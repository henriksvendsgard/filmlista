"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSupabase } from "@/components/SupabaseProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AuthComponent() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSignUp, setIsSignUp] = useState(false);
    const [isResetPassword, setIsResetPassword] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [displayName, setDisplayName] = useState("");
    const router = useRouter();
    const { supabase } = useSupabase();

    // Sjekk om vi har en recovery token i URL-en
    useEffect(() => {
        const hash = window.location.hash;
        if (hash && (hash.includes("type=recovery") || hash.includes("auth-callback"))) {
            setIsResetPassword(true);
        }
    }, []);

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Passordene er ikke like!");
            return;
        }
        if (password.length < 6) {
            setError("Passordet må være minst 6 tegn!");
            return;
        }

        setLoading(true);
        setError(null);

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
                data: { display_name: displayName },
            },
        });

        if (error) {
            setError(error.message);
        } else {
            setMessage("Sjekk e-posten din for bekreftelseslenke. Profilen din er opprettet!");
            setIsSignUp(false);
        }

        setLoading(false);
    };

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                if (error.message === "Invalid login credentials") {
                    setError("Feil e-post eller passord");
                } else {
                    setError(error.message);
                }
            } else if (data.user) {
                // Get the display name from user metadata
                const displayName = data.user.user_metadata?.display_name;

                if (displayName) {
                    // Update the profiles table with the display name from metadata
                    const { error: profileError } = await supabase
                        .from("profiles")
                        .update({ displayname: displayName })
                        .eq("id", data.user.id);

                    if (profileError) {
                        console.error("Error updating profile displayname:", profileError);
                    }
                }

                router.push("/");
                router.refresh();
            }
        } catch (err) {
            console.error("SignIn error:", err);
            setError("Noe gikk galt ved innlogging. Prøv igjen senere.");
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        if (!isResetPassword) {
            // Send tilbakestillingsmail med spesifikk redirect URL
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/login#auth-callback`,
            });

            if (error) {
                setError(error.message);
            } else {
                setMessage("Sjekk e-posten din for instruksjoner om tilbakestilling av passord.");
            }
        } else {
            // Sett nytt passord
            if (password !== confirmPassword) {
                setError("Passordene er ikke like!");
                setLoading(false);
                return;
            }

            const { error } = await supabase.auth.updateUser({ password });

            if (error) {
                setError(error.message);
            } else {
                setMessage("Passordet ditt er oppdatert. Du kan nå logge inn.");
                setIsResetPassword(false);
                // Fjern hash fra URL
                window.history.replaceState(null, "", window.location.pathname);
            }
        }
        setLoading(false);
    };

    if (isResetPassword) {
        return (
            <Card className="min-w-full sm:w-[350px]">
                <CardHeader>
                    <CardTitle>Tilbakestill passord</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handlePasswordReset} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">Nytt passord</Label>
                            <Input
                                className="text-base"
                                id="password"
                                type="password"
                                placeholder="Nytt passord"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Bekreft nytt passord</Label>
                            <Input
                                className="text-base"
                                id="confirmPassword"
                                type="password"
                                placeholder="Bekreft nytt passord"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="mt-6 flex justify-end">
                            <Button type="submit" disabled={loading}>
                                Oppdater passord
                            </Button>
                        </div>
                    </form>
                </CardContent>
                {(error || message) && (
                    <CardFooter className="flex flex-col space-y-2">
                        <Alert variant={error ? "destructive" : "default"}>
                            <AlertDescription>{error || message}</AlertDescription>
                        </Alert>
                    </CardFooter>
                )}
            </Card>
        );
    }

    return (
        <Card className="min-w-full sm:w-[350px]">
            <CardHeader>
                <CardTitle>{isSignUp ? "Registrer ny bruker" : "Logg inn med epost"}</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Epost</Label>
                        <Input
                            className="text-base"
                            id="email"
                            type="email"
                            placeholder="Epost"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Passord</Label>
                        <Input
                            className="text-base"
                            id="password"
                            type="password"
                            placeholder="Passord"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    {isSignUp && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Bekreft passord</Label>
                                <Input
                                    className="text-base"
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="Bekreft passord"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="displayName">Visningsnavn</Label>
                                <Input
                                    className="text-base"
                                    id="displayName"
                                    type="text"
                                    placeholder="Visningsnavn"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    required
                                />
                            </div>
                        </>
                    )}
                    <div>
                        <div className="flex flex-col space-y-4">
                            <div className="flex w-full flex-row-reverse justify-between">
                                <Button type="submit" disabled={loading}>
                                    {isSignUp ? "Registrer" : "Logg inn"}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setIsSignUp(!isSignUp);
                                        setError(null);
                                        setMessage(null);
                                        setPassword("");
                                        setConfirmPassword("");
                                        setDisplayName("");
                                    }}
                                    disabled={loading}
                                >
                                    {isSignUp ? "Tilbake til innlogging" : "Ny bruker?"}
                                </Button>
                            </div>
                            {!isSignUp && (
                                <Button
                                    type="button"
                                    variant="link"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handlePasswordReset(e);
                                    }}
                                    disabled={loading || !email}
                                >
                                    Glemt passord?
                                </Button>
                            )}
                        </div>
                    </div>
                </form>
            </CardContent>
            {(error || message) && (
                <CardFooter className="flex flex-col space-y-2">
                    <Alert variant={error ? "destructive" : "default"}>
                        <AlertDescription>{error || message}</AlertDescription>
                    </Alert>
                </CardFooter>
            )}
        </Card>
    );
}
