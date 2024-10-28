import SearchBar from "./SearchBar";

export default function SearchBox({ inHeader }: { inHeader?: boolean }) {
	return (
		<>
			<div className={`${!inHeader && "mx-auto w-full px-5 lg:px-10 sm:hidden"} ${inHeader && "w-full max-w-[400px] px-0 hidden sm:block"}`}>
				<SearchBar />
			</div>
		</>
	);
}
