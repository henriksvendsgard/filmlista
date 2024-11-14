"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/SupabaseProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AuthComponent() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const router = useRouter();
	const { supabase } = useSupabase();

	const handleSignUp = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);
		setError("Registrering er ikke aktivert enda. Spør admin om å opprette bruker manuelt.");
		// const { error } = await supabase.auth.signUp({ email, password });
		// if (error) setError(error.message);
		// else setError("Sjekk eposten din!");
		setLoading(false);
	};

	const handleSignIn = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);
		const { error } = await supabase.auth.signInWithPassword({ email, password });
		if (error) {
			setError(error.message);
		} else {
			router.push("/"); // Redirect etter login
			router.refresh(); // Refresh
		}
		setLoading(false);
	};

	return (
		<Card className="min-w-full sm:w-[350px]">
			<CardHeader>
				<CardTitle>Logg inn med brukeren din</CardTitle>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSignIn} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="email">Epost</Label>
						<Input id="email" type="email" placeholder="Epost" value={email} onChange={(e) => setEmail(e.target.value)} required />
					</div>
					<div className="space-y-2">
						<Label htmlFor="password">Passord</Label>
						<Input id="password" type="password" placeholder="Passord" value={password} onChange={(e) => setPassword(e.target.value)} required />
					</div>
					<div>
						<div className="flex flex-row-reverse justify-between w-full">
							<Button type="submit" onClick={handleSignIn} disabled={loading}>
								Logg inn
							</Button>
							<Button className="bg-gray-500" onClick={handleSignUp} disabled={loading}>
								Registrer
							</Button>
						</div>
					</div>
				</form>
			</CardContent>
			<CardFooter className="flex flex-col space-y-2">
				{error && (
					<Alert variant={error.includes("Registrering er ikke aktivert enda. Spør admin om å opprette bruker manuelt.") ? "default" : "destructive"}>
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}
			</CardFooter>
		</Card>
	);
}
