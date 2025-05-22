"use client";

import { useEffect, useState } from "react";
import SearchBox from "../Search/SearchBox";
import NavItems from "./NavItems";
import { useSupabase } from "../SupabaseProvider";
import { usePathname } from "next/navigation";

export default function Header() {
    const [scrollDirection, setScrollDirection] = useState<"up" | "down">("up");
    const [lastScrollY, setLastScrollY] = useState(0);
    const [showInfoBar, setShowInfoBar] = useState(false);

    const pathname = usePathname();
    const { user } = useSupabase();

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                setScrollDirection("down");
            }
            if (currentScrollY < lastScrollY) {
                setScrollDirection("up");
            }

            setLastScrollY(currentScrollY);
        };

        window.addEventListener("scroll", handleScroll);

        return () => window.removeEventListener("scroll", handleScroll);
    }, [lastScrollY]);

    useEffect(() => {
        if (user) {
            const displayName = user.user_metadata?.display_name;
            if (!displayName && pathname !== "/profile") {
                setShowInfoBar(true);
            } else {
                setShowInfoBar(false);
            }
        }
    }, [user, pathname]);

    return (
        <div
            className={`fixed top-[-1px] z-50 w-full ${scrollDirection === "down" ? "pb-3" : "pb-6"} transition-all duration-300 sm:pb-0`}
        >
            {showInfoBar && (
                <div className="bg-blue-800 py-3 text-center text-white">
                    <p className="px-4">
                        <strong>Hallo!</strong> Du har ikke satt et visningsnavn enda... Gå til{" "}
                        <a href="/profile" className="underline">
                            profilen din
                        </a>{" "}
                        for å gjøre dette.
                    </p>
                </div>
            )}
            <div
                className={`flex justify-between gap-6 px-5 lg:p-10 ${scrollDirection === "down" ? "py-3 lg:py-8" : "py-5"} relative items-center transition-all duration-300`}
            >
                <div className="flex w-full gap-6">
                    <a href="/" className="flex items-center">
                        <div className="flex gap-3">
                            <svg
                                className="w-8 sm:w-8"
                                width="40"
                                height="40"
                                viewBox="0 0 87 97"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M22.2615 0.368028C13.096 0.980574 7.65115 3.09045 4.54305 7.21946C2.11555 10.4637 1.04927 14.0028 0.323288 21.3307C-0.107763 25.5958 -0.107763 78.5016 0.323288 82.245C1.11733 89.3687 2.47854 92.1138 6.44875 94.6774C8.53594 96.0159 10.7139 96.6512 13.3002 96.6512C15.4101 96.6512 15.5008 96.6285 17.2704 95.6756C18.2913 95.1538 19.9701 94.0422 21.0137 93.2027C23.2824 91.4105 29.8843 84.8313 34.0587 80.1805C39.7077 73.9189 40.5244 73.3064 43.1334 73.3064C44.9484 73.3064 46.0827 73.9189 48.0111 75.9607C61.0788 89.8905 65.48 94.0648 68.9965 95.8344C71.9004 97.2864 75.0993 97.2183 78.3435 95.6302C79.9089 94.8589 80.4987 94.4051 81.9734 92.7944C83.9698 90.6164 84.7865 89.3233 85.4445 87.3495C86.8964 82.9483 87.1006 77.7303 86.9645 48.2147C86.8511 23.0095 86.8057 21.4668 85.7621 16.2942C84.7865 11.3938 83.2665 8.37649 80.3853 5.65407C76.8915 2.31909 72.581 0.9352 63.8919 0.345341C60.0352 0.0730983 26.2317 0.0957852 22.2615 0.368028ZM59.9444 20.6728C61.5098 21.4214 62.3265 23.2591 61.8501 24.9606C61.6232 25.7773 60.1713 27.32 51.0058 36.4629C39.4582 47.9651 39.5943 47.8744 37.7113 47.3072C36.9399 47.0803 35.8283 46.0821 31.4951 41.7943C28.5685 38.8903 26.0502 36.236 25.846 35.873C25.1881 34.6025 25.4377 32.6968 26.4359 31.5625C27.3887 30.4962 29.5667 30.1105 30.9052 30.8138C31.2682 31.018 33.1512 32.7649 35.0796 34.6933L38.5961 38.2324L47.2171 29.6114C51.9586 24.8925 56.1557 20.8543 56.5187 20.6728C57.4035 20.1964 58.9689 20.219 59.9444 20.6728Z"
                                    fill={"currentColor"}
                                />
                            </svg>

                            <span className="sr-only">Watcher</span>
                        </div>
                    </a>
                    <SearchBox inHeader />
                </div>
                <NavItems />
            </div>
            <SearchBox />
            <div className="absolute bottom-0 left-0 right-0 top-0 z-[-1] rounded-bl-md rounded-br-md bg-background/75 backdrop-blur-lg"></div>
        </div>
    );
}
