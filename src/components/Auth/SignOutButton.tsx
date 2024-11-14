"use client";

import { useSupabase } from "@/components/SupabaseProvider";
import { Button } from "@/components/ui/button";
import { LogOut, icons } from "lucide-react";
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
		<Button className="w-10 p-0 sm:w-full sm:p-4" variant={"outline"} onClick={handleSignOut} disabled={isLoading}>
			<LogOut className="w-[18px] h-[18px] sm:pr-1" />
			<span className="hidden sm:block">{isLoading ? "Logger ut..." : "Logg ut"}</span>
		</Button>
	);
}
