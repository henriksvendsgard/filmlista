import type { Metadata } from "next";
import { Rethink_Sans } from "next/font/google";
import { Inter as FontSans } from "next/font/google";
import "./globals.css";

import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import Header from "@/components/Header/Header";

const fontSans = FontSans({
	subsets: ["latin"],
	variable: "--font-sans",
});

const fontHeading = Rethink_Sans({
	subsets: ["latin"],
	variable: "--font-heading",
});

export const metadata: Metadata = {
	title: "Watcher",
	description: "A simple movie watchlist app to keep track of your favorite movies.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={cn("min-h-screen font-sans antialiased", fontSans.variable, fontHeading.variable)}>
				<ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
					<Header />
					<div className="flex flex-col items-center w-full">{children}</div>
				</ThemeProvider>
			</body>
		</html>
	);
}
