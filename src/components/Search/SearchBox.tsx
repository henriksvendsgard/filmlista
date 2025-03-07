import { useSupabase } from "@/components/SupabaseProvider";
import SearchBar from "./SearchBar";

export default function SearchBox({ inHeader }: { inHeader?: boolean }) {
    const { user } = useSupabase();

    if (user) {
        return (
            <>
                <div
                    className={`${!inHeader && "mx-auto w-full px-5 sm:hidden lg:px-10"} ${inHeader && "hidden w-full max-w-[400px] px-0 sm:block"}`}
                >
                    <SearchBar />
                </div>
            </>
        );
    }
}
