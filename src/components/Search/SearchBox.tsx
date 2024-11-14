import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import SearchBar from "./SearchBar";

export default function SearchBox({ inHeader }: { inHeader?: boolean }) {
	const [user, setUser] = useState<User | null>(null);
	const supabase = createClientComponentClient();

	useEffect(() => {
		const fetchUser = async () => {
			const { data } = await supabase.auth.getUser();
			setUser(data.user);
		};

		fetchUser();

		const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
			setUser(session?.user || null);
		});
	}, [supabase]);

	if (user) {
		return (
			<>
				<div className={`${!inHeader && "mx-auto w-full px-5 lg:px-10 sm:hidden"} ${inHeader && "w-full max-w-[400px] px-0 hidden sm:block"}`}>
					<SearchBar />
				</div>
			</>
		);
	}
}
