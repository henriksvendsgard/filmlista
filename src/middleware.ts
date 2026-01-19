import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req, res });

    // Public paths that don't require authentication
    const publicPaths = ["/login", "/register"];
    const isPublicPath = publicPaths.includes(req.nextUrl.pathname);

    // Allow public paths without checking session (prevents redirect loops)
    if (isPublicPath) {
        const {
            data: { session },
        } = await supabase.auth.getSession();

        // If user is signed in and tries to access auth pages, redirect to home
        if (session) {
            return NextResponse.redirect(new URL("/", req.url));
        }
        return res;
    }

    // For protected routes, check session
    const {
        data: { session },
        error,
    } = await supabase.auth.getSession();

    // Handle errors or missing session - redirect to login
    if (error || !session) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    // Update session if it exists
    if (session) {
        res.headers.set("x-middleware-cache", "no-cache");
    }

    return res;
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images|icons|manifest.webmanifest).*)"],
};
