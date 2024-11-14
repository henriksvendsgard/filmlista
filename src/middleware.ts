import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
	const res = NextResponse.next();
	const supabase = createMiddlewareClient({ req, res });

	const {
		data: { session },
	} = await supabase.auth.getSession();

	if (!session && req.nextUrl.pathname !== "/login") {
		console.log("Redirecting to login page");
		return NextResponse.redirect(new URL("/login", req.url));
	}

	if (session && req.nextUrl.pathname === "/login") {
		console.log("Redirecting to home page");
		return NextResponse.redirect(new URL("/", req.url));
	}

	return res;
}

export const config = {
	matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icons|manifest.webmanifest).*)"],
};
