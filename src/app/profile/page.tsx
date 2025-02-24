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
			const { error: profileError } = await supabase.from("profiles").update({ displayname: displayName }).eq("id", user.id);

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
		}
	};

	return (
		<div className="px-5 container ">
			<Card className="max-w-lg w-full mx-auto mt-10 p-6 rounded-lg shadow-md">
				<h1 className="text-2xl font-bold mb-4">Din profil</h1>
				<strong className="mb-4">E-post: </strong>
				<p className="mb-4 mt-4">{user?.email}</p>
				<div>
					<strong className="mb-4">Visningsnavn: </strong>
					{!editingDisplayName ? (
						<div className="flex items-center gap-2 mt-4">
							<p>{tempDisplayName ? tempDisplayName : user?.display_name}</p>
							{user?.display_name && (
								<Button variant="outline" size={"icon"} onClick={() => setEditingDisplayName(true)}>
									<PencilIcon className="w-4 h-4" />
								</Button>
							)}
						</div>
					) : (
						<form onSubmit={handleUpdate} className="space-y-4 mt-4">
							<Input
								type="text"
								placeholder={user?.display_name ? user?.display_name : "Visningsnavn"}
								value={displayName}
								onChange={(e) => setDisplayName(e.target.value)}
								required
								className="w-full max-w-72 text-base p-2 border border-gray-300 rounded"
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
								<Button type="submit" disabled={!displayName} className="bg-blue-800 hover:bg-blue-900 text-white py-2 rounded">
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
