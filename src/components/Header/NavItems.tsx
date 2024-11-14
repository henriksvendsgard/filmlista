"use client";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";
import { CircleCheckBig, PersonStandingIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SignOutButton from "../Auth/SignOutButton";
import { ModeToggle } from "./ModeToggle";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

export default function NavItems() {
	const pathname = usePathname();
	const isActivePage = (path: string) => {
		return pathname === path;
	};

	const [user, setUser] = useState<User | null>(null);
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
	}, []);

	return (
		<NavigationMenu className="">
			<NavigationMenuList>
				{user && (
					<>
						<NavigationMenuItem className=" rounded-md outline-1 outline outline-input">
							<Link href="/watchlist" legacyBehavior passHref>
								<NavigationMenuLink active={isActivePage("/watchlist")} className={navigationMenuTriggerStyle()}>
									<CircleCheckBig className="w-5 h-5 pr-1" />
									<span>Liste</span>
								</NavigationMenuLink>
							</Link>
						</NavigationMenuItem>
						<NavigationMenuItem>
							<DropdownMenu>
								<DropdownMenuTrigger className={navigationMenuTriggerStyle()}>
									<PersonStandingIcon className="w-5 h-5 pr-1" />
									<span>Profil</span>
								</DropdownMenuTrigger>
								<DropdownMenuContent>
									<DropdownMenuLabel>Min profil</DropdownMenuLabel>
									<DropdownMenuSeparator />
									<Link href="/profile/watchlist" className="w-full" legacyBehavior passHref>
										<DropdownMenuItem className="cursor-pointer">
											<SignOutButton />
										</DropdownMenuItem>
									</Link>
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
