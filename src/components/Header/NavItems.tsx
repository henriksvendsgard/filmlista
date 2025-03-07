"use client";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
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
                                    className={`${navigationMenuTriggerStyle()} outline outline-1 -outline-offset-1 outline-accent ${
                                        isActivePage("/watchlist")
                                            ? "bg-filmlista-primary text-white hover:bg-filmlista-primary/80 hover:text-white focus:bg-filmlista-primary focus:text-white"
                                            : ""
                                    }`}
                                >
                                    <CircleCheckBig className="h-5 w-5 pr-1" />
                                    <span>Lista</span>
                                </NavigationMenuLink>
                            </Link>
                        </NavigationMenuItem>
                        <NavigationMenuItem>
                            <DropdownMenu>
                                <DropdownMenuTrigger
                                    className={`${navigationMenuTriggerStyle()} outline outline-1 -outline-offset-1 outline-accent`}
                                >
                                    <UserIcon className="h-5 w-5 pr-1" />
                                    <span>Konto</span>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <Link href="/profile" className="w-full">
                                        <DropdownMenuItem className="cursor-pointer">
                                            <UserIcon className="mr-2 h-4 w-4" />
                                            <span>Profil</span>
                                        </DropdownMenuItem>
                                    </Link>
                                    <Link href="/lists" className="w-full">
                                        <DropdownMenuItem className="cursor-pointer">
                                            <ListIcon className="mr-2 h-4 w-4" />
                                            <span>Dine lister</span>
                                        </DropdownMenuItem>
                                    </Link>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                                        <LogOut className="mr-2 h-4 w-4" />
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
