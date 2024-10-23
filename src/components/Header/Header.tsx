"use client";

import Image from "next/image";
import NavItems from "./NavItems";
import SearchBox from "../Search/SearchBox";
import { useMediaQuery } from "react-responsive";

export default function Header() {
	const isMobile = useMediaQuery({ maxWidth: 762 });

	return (
		<>
			<div className="flex justify-between px-5 py-5 items-center lg:p-10">
				<div className="flex gap-8 max-w-96">
					<a href="/">
						<Image className="min-w-10" src={"/watcher-logo.png"} width={40} height={40} alt="Watcher Logo"></Image>
					</a>
					{!isMobile && <SearchBox inHeader />}
				</div>
				<NavItems />
			</div>
			{isMobile && <SearchBox />}
		</>
	);
}
