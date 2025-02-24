import { Metadata } from "next";
import { Inter as FontSans, Lexend } from "next/font/google";
import "./globals.css";

import Footer from "@/components/Footer/Footer";
import Header from "@/components/Header/Header";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import CheckPWA from "@/components/utils/CheckPWA";
import { cn } from "@/lib/utils";
import SupabaseProvider from "@/components/SupabaseProvider";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import ZoomDisabler from "@/components/utils/ZoomDisabler";

const fontSans = FontSans({
	subsets: ["latin"],
	variable: "--font-sans",
});

const fontHeading = Lexend({
	subsets: ["latin"],
	variable: "--font-heading",
	weight: "400",
});

const fontBody = Lexend({
	subsets: ["latin"],
	variable: "--font-body",
	weight: "400",
});

export const metadata: Metadata = {
	title: "Filmlista",
	description: "En enkel filmliste for å holde styr på filmer du vil se.",
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const supabase = createServerComponentClient({ cookies });

	const {
		data: { user },
	} = await supabase.auth.getUser();

	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
			</head>
			<body className={cn("min-h-screen flex flex-col font-sans antialiased", fontSans.variable, fontHeading.variable, fontBody.variable)}>
				<SupabaseProvider initialUser={user}>
					<ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
						<Header />
						<div className="flex flex-col items-center w-full pt-40">
							{children}
							<ZoomDisabler />
							<CheckPWA />
						</div>
						<Footer />
						<Toaster />
					</ThemeProvider>
				</SupabaseProvider>
			</body>
		</html>
	);
}
