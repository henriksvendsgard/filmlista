"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/SupabaseProvider";
import { Button } from "@/components/ui/button";

export default function SignOutButton() {
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();
	const { supabase } = useSupabase();

	const handleSignOut = async () => {
		setIsLoading(true);
		try {
			await supabase.auth.signOut();
			router.push("/login");
			router.refresh();
		} catch (error) {
			console.error("Error signing out:", error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Button variant={"ghost"} onClick={handleSignOut} disabled={isLoading}>
			{isLoading ? "Logger ut..." : "Logg ut"}
		</Button>
	);
}
