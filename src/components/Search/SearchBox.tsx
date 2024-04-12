import SearchBar from "./SearchBar";

export default function SearchBox() {
	return (
		<>
			<div className="mx-auto lg:max-w-[500px]">
				<h2 className="mb-4">Søk etter en film...</h2>
				<SearchBar />
			</div>
		</>
	);
}
