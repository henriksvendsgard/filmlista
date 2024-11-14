"use client";

import { useSupabase } from "@/components/SupabaseProvider";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
			<LogOut className="w-5 h-5 pr-1" />
			{isLoading ? "Logger ut..." : "Logg ut"}
		</Button>
	);
}
