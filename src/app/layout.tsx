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
import { CelebrationProvider } from "@/contexts/CelebrationContext";
import { ListActionsProvider } from "@/contexts/ListActionsContext";
import ZoomDisabler from "@/components/utils/ZoomDisabler";
import { createClient } from "@/utils/supabase/server";

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
    description: "Lag delte filmlister, filtrer på strømmetjenestene dine, og finn neste filmkveld sammen.",
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    return (
        <html lang="no" suppressHydrationWarning>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
                <script
                    dangerouslySetInnerHTML={{
                        __html: `(function(){try{if(sessionStorage.getItem("filmlista-welcome-login")==="1"){document.documentElement.classList.add("celebration-pending")}}catch(e){}})();`,
                    }}
                />
            </head>
            <body
                className={cn(
                    "font-sans flex min-h-screen flex-col antialiased",
                    fontSans.variable,
                    fontHeading.variable,
                    fontBody.variable
                )}
            >
                <SupabaseProvider initialUser={user}>
                    <CelebrationProvider>
                        <ListActionsProvider>
                            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                                <Header />
                                <div className="flex w-full flex-col items-center pt-40">
                                    {children}
                                    <ZoomDisabler />
                                    <CheckPWA />
                                </div>
                                <Footer />
                                <Toaster />
                            </ThemeProvider>
                        </ListActionsProvider>
                    </CelebrationProvider>
                </SupabaseProvider>
            </body>
        </html>
    );
}
