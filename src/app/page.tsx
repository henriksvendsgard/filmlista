import SearchBox from "@/components/Search/SearchBox";

export default function Home() {
	return (
		<div className="w-full px-10">
			<div className="flex flex-col items-center">
				<h1 className="text-2xl h-[150px] flex items-center">Watcher</h1>
			</div>
			<SearchBox />
		</div>
	);
}
