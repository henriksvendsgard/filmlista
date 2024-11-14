import AuthComponent from "@/components/Auth/AuthComponent";
import { Metadata } from "next";

export const metadata: Metadata = {
	title: "Login | Movie Watchlist",
	description: "Login to your Movie Watchlist account",
};

export default function LoginPage() {
	return (
		<div className="mt-12 px-5 sm:flex items-center sm:min-h-[600px] bg-background w-full sm:w-auto">
			<AuthComponent />
		</div>
	);
}
