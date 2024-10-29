"use client";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";
import { CircleCheckBig, PersonStandingIcon, Popcorn } from "lucide-react";
import Link from "next/link";
import { ModeToggle } from "./ModeToggle";
import { usePathname } from "next/navigation";

export default function NavItems() {
	const isActivePage = (path: string) => {
		const pathname = usePathname();
		return pathname === path;
	};

	return (
		<NavigationMenu className="">
			<NavigationMenuList>
				{/* <NavigationMenuItem>
					<Link href="/explore" legacyBehavior passHref>
						<NavigationMenuLink active={isActivePage("/explore")} className={navigationMenuTriggerStyle()}>
							<Popcorn className="w-5 h-5 pr-1" />
							<span>Explore</span>
						</NavigationMenuLink>
					</Link>
				</NavigationMenuItem> */}
				<NavigationMenuItem>
					<Link href="/watchlist" legacyBehavior passHref>
						<NavigationMenuLink active={isActivePage("/watchlist")} className={navigationMenuTriggerStyle()}>
							<CircleCheckBig className="w-5 h-5 pr-1" />
							<span>Liste</span>
						</NavigationMenuLink>
					</Link>
				</NavigationMenuItem>
				<NavigationMenuItem>
					<DropdownMenu>
						{/* Profil er disabled for nå */}
						<DropdownMenuTrigger disabled className={navigationMenuTriggerStyle()}>
							<PersonStandingIcon className="w-5 h-5 pr-1" />
							<span>Profil</span>
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							<DropdownMenuLabel>Min profil</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<Link href="/profile" className="w-full" legacyBehavior passHref>
								<DropdownMenuItem className="cursor-pointer">Info</DropdownMenuItem>
							</Link>
							<Link href="/profile/watchlist" className="w-full" legacyBehavior passHref>
								<DropdownMenuItem className="cursor-pointer">Logg ut</DropdownMenuItem>
							</Link>
						</DropdownMenuContent>
					</DropdownMenu>
				</NavigationMenuItem>
				<ModeToggle />
			</NavigationMenuList>
		</NavigationMenu>
	);
}
