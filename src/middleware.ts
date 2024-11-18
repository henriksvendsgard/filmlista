import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Public paths that don't require authentication
  const publicPaths = ['/login', '/register'];
  const isPublicPath = publicPaths.includes(req.nextUrl.pathname);

  if (!session && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (session && isPublicPath) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Important: Return the response with updated cookies
  return res;
}

export const config = {
	matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images|icons|manifest.webmanifest).*)"],
};
