"use client";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";
import { CircleCheckBig, ListIcon, UserIcon, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ModeToggle } from "./ModeToggle";
import { useSupabase } from "@/components/SupabaseProvider";
import { useState } from "react";

export default function NavItems() {
	const pathname = usePathname();
	const isActivePage = (path: string) => {
		return pathname === path;
	};

	const [isLoading, setIsLoading] = useState(false);
	const { supabase, user } = useSupabase();
	const router = useRouter();

	const handleSignOut = async () => {
		setIsLoading(true);
		try {
			await supabase.auth.signOut();
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
								<NavigationMenuLink
									className={`${navigationMenuTriggerStyle()} outline outline-1 -outline-offset-1 outline-accent  ${
										isActivePage("/watchlist") ? "bg-filmlista-primary hover:bg-filmlista-hover focus:bg-filmlista-primary" : ""
									}`}
								>
									<CircleCheckBig className="w-5 h-5 pr-1" />
									<span>Lista</span>
								</NavigationMenuLink>
							</Link>
						</NavigationMenuItem>
						<NavigationMenuItem>
							<DropdownMenu>
								<DropdownMenuTrigger className={`${navigationMenuTriggerStyle()} outline outline-1 -outline-offset-1 outline-accent`}>
									<UserIcon className="w-5 h-5 pr-1" />
									<span>Profil</span>
								</DropdownMenuTrigger>
								<DropdownMenuContent>
									<Link href="/profile" className="w-full">
										<DropdownMenuItem className="cursor-pointer">
											<UserIcon className="w-4 h-4 mr-2" />
											<span>Profil</span>
										</DropdownMenuItem>
									</Link>
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
				<div className="pl-2 sm:pl-4">
					<ModeToggle />
				</div>
			</NavigationMenuList>
		</NavigationMenu>
	);
}
