"use client";

import { useSupabase } from "@/components/SupabaseProvider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";
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

	useEffect(() => {
		const fetchUserProfile = async () => {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (user) {
				const displayName = user.user_metadata?.display_name; // Access the metadata
				setUser({ ...user, display_name: displayName });
			}
		};
		fetchUserProfile();
	}, [supabase]);

	const handleUpdate = async (e: React.FormEvent) => {
		e.preventDefault();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (user) {
			if (!user) {
				setMessage("Ingen bruker funnet");
				return;
			}

			const { error: updateError } = await supabase.auth.updateUser({
				data: { display_name: displayName },
			});

			if (updateError) {
				setMessage("Feil ved oppdatering av brukerdata");
				return;
			}

			const { error: profileError } = await supabase.from("profiles").update({ displayname: displayName }).eq("id", user.id);

			if (profileError) {
				setMessage("Feil ved oppdatering av visningsnavn");
				return;
			}

			toast({
				title: "Visningsnavn oppdatert",
				description: `visningsnavnet ditt er nå "${displayName}"`,
				variant: "default",
				className: "bg-green-800 text-white",
			});
			setTempDisplayName(displayName);
		}
	};

	return (
		<div className="px-5 container ">
			<Card className="max-w-lg w-full mx-auto mt-10 p-6 rounded-lg shadow-md">
				<h1 className="text-2xl font-bold mb-4">Din profil</h1>
				<strong className="mb-4">E-post: {user?.email}</strong>
				<p className="mb-4 mt-4">Visningsnavn: {tempDisplayName ? tempDisplayName : user?.display_name}</p>
				<form onSubmit={handleUpdate} className="space-y-4">
					<Input
						type="text"
						placeholder="Endre visningsnavn"
						value={displayName}
						onChange={(e) => setDisplayName(e.target.value)}
						required
						className="w-full p-2 border border-gray-300 rounded"
					/>
					<Button type="submit" className="w-full bg-blue-800 hover:bg-blue-900 text-white py-2 rounded">
						Endre
					</Button>
				</form>
				{message && <p className="mt-4 text-red-500">{message}</p>}
			</Card>
		</div>
	);
}
