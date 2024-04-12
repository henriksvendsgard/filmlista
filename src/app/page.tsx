import SearchBox from "@/components/Search/SearchBox";
import Image from "next/image";

export default function Home() {
	return (
		<div className="w-full px-10">
			<div className="flex flex-col items-center">
				<Image
					className="mb-10"
					src="/superbad-removebg-preview.png"
					alt="logo"
					width={500}
					height={500}
				/>
			</div>
			<SearchBox />
		</div>
	);
}
