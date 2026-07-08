import { updateSession } from "@/utils/supabase/middleware";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
    return updateSession(request);
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images|icons|manifest.webmanifest).*)"],
};
