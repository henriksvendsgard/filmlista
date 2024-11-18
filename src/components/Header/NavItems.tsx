"use client";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";
import { CircleCheckBig, ListIcon, UserIcon, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ModeToggle } from "./ModeToggle";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { useSupabase } from "@/components/SupabaseProvider";

export default function NavItems() {
	const pathname = usePathname();
	const isActivePage = (path: string) => {
		return pathname === path;
	};

	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const supabase = createClientComponentClient();

	useEffect(() => {
		const fetchUser = async () => {
			const { data } = await supabase.auth.getUser();
			setUser(data.user);
		};

		fetchUser();

		const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
			setUser(session?.user || null);
		});
	}, [supabase.auth]);

	const router = useRouter();

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
		<NavigationMenu className="">
			<NavigationMenuList>
				{user && (
					<>
						<NavigationMenuItem>
							<Link href="/watchlist" legacyBehavior passHref>
								<NavigationMenuLink active={isActivePage("/watchlist")} className={`${navigationMenuTriggerStyle()} outline outline-1 -outline-offset-1 outline-accent`}>
									<CircleCheckBig className="w-5 h-5 pr-1" />
									<span>Lista</span>
								</NavigationMenuLink>
							</Link>
						</NavigationMenuItem>
						<NavigationMenuItem>
							<DropdownMenu>
								<DropdownMenuTrigger className={navigationMenuTriggerStyle()}>
									<UserIcon className="w-5 h-5 pr-1" />
									<span>Profil</span>
								</DropdownMenuTrigger>
								<DropdownMenuContent>
									<Link href="/lists" className="w-full">
										<DropdownMenuItem className="cursor-pointer">
											<ListIcon className="w-4 h-4 mr-2" />
											<span>Lister</span>
										</DropdownMenuItem>
									</Link>
									<DropdownMenuSeparator />
									<DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
										<LogOut className="w-4 h-4 mr-2" />
										<span>Logg ut</span>
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</NavigationMenuItem>
					</>
				)}
				<ModeToggle />
			</NavigationMenuList>
		</NavigationMenu>
	);
}
