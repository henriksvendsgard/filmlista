"use client";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";
import { CircleCheckBig, PersonStandingIcon, Popcorn } from "lucide-react";
import Link from "next/link";
import { ModeToggle } from "./ModeToggle";
import { usePathname } from "next/navigation";
import SignOutButton from "../Auth/SignOutButton";

export default function NavItems() {
	const pathname = usePathname();
	const isActivePage = (path: string) => {
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
						{/* Profil er disabled for nå */}
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
				<ModeToggle />
			</NavigationMenuList>
		</NavigationMenu>
	);
}
