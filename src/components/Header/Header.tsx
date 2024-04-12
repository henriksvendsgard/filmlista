import Image from "next/image";
import NavItems from "./NavItems";

export default function Header() {
	return (
		<div className="flex justify-between px-10 py-8 items-center">
			<a href="/">
				<Image
					src={"/watcher-logo.png"}
					width={40}
					height={40}
					alt="Watcher Logo"
				></Image>
			</a>
			<NavItems />
		</div>
	);
}
