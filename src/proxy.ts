import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase session cookie on every request. Without this, a session that's
 * about to expire can go stale between server-component renders (which can't always write
 * cookies back) and the next request would see the person as signed out. See the note in
 * src/lib/supabase/server.ts. Named `proxy` (not `middleware`) per Next.js 16's rename.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Touching the session is what actually triggers a refresh when the access token is near
  // expiry; the result itself isn't used here; sign-in redirects are handled per-route.
  await supabase.auth.getUser();

  return response;
}

export const proxyConfig = {
  matcher: [
    /*
     * Run on everything except static assets and image optimisation, so the session stays
     * fresh across every page and server action. Excluding these keeps the proxy off the
     * hot path for files that never need auth.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
