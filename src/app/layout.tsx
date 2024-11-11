import type { Metadata } from "next";
import { Inter as FontSans, Lexend } from "next/font/google";
import "./globals.css";

import Header from "@/components/Header/Header";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

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
			<body className={cn("min-h-screen font-sans antialiased", fontSans.variable, fontHeading.variable, fontBody.variable)}>
				<ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
					<Header />
					<div className="flex flex-col items-center w-full pt-36">{children}</div>
					<Toaster />
				</ThemeProvider>
			</body>
		</html>
	);
}
