"use client";

import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
	navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, CircleCheckBig, Popcorn } from "lucide-react";
import Link from "next/link";
import { ModeToggle } from "./ModeToggle";

export default function NavItems() {
	return (
		<NavigationMenu className="">
			<NavigationMenuList>
				<NavigationMenuItem>
					<Link href="/" legacyBehavior passHref>
						<NavigationMenuLink className={navigationMenuTriggerStyle()}>
							<Popcorn className="w-5 h-5 pr-1" />
							<span>Explore</span>
						</NavigationMenuLink>
					</Link>
				</NavigationMenuItem>
				<NavigationMenuItem>
					<Link href="/watchlist" legacyBehavior passHref>
						<NavigationMenuLink className={navigationMenuTriggerStyle()}>
							<CircleCheckBig className="w-5 h-5 pr-1" />
							<span>Watchlist</span>
						</NavigationMenuLink>
					</Link>
				</NavigationMenuItem>
				<NavigationMenuItem>
					<DropdownMenu>
						<DropdownMenuTrigger className={navigationMenuTriggerStyle()}>
							Profil
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							<DropdownMenuLabel>Min profil</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<Link href="/profile" className="w-full" legacyBehavior passHref>
								<DropdownMenuItem className="cursor-pointer">
									Info
								</DropdownMenuItem>
							</Link>
							<Link
								href="/profile/watchlist"
								className="w-full"
								legacyBehavior
								passHref
							>
								<DropdownMenuItem className="cursor-pointer">
									Logg ut
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
