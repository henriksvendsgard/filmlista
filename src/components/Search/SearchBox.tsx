import SearchBar from "./SearchBar";

export default function SearchBox({ inHeader }: { inHeader?: boolean }) {
	return (
		<>
			<div className={`${!inHeader && "mx-auto w-full px-10"} ${inHeader && "w-[300px] px-0"}`}>
				<SearchBar />
			</div>
		</>
	);
}
