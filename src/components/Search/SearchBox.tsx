import SearchBar from "./SearchBar";

export default function SearchBox({ inHeader }: { inHeader?: boolean }) {
	return (
		<>
			<div className={`mx-auto w-full px-10 ${inHeader && "w-96 px-0"}`}>
				<SearchBar />
			</div>
		</>
	);
}
