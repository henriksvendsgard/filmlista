import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req, res });

    const {
        data: { session },
        error,
    } = await supabase.auth.getSession();

    // Public paths that don't require authentication
    const publicPaths = ["/login", "/register"];
    const isPublicPath = publicPaths.includes(req.nextUrl.pathname);

    // Handle errors or missing session
    if (error || (!session && !isPublicPath)) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    // If user is signed in and tries to access auth pages, redirect to home
    if (session && isPublicPath) {
        return NextResponse.redirect(new URL("/", req.url));
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
