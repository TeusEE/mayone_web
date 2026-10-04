import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAuthPublicConfig } from "@/lib/supabase/auth-config";
import type { Database } from "@/types/supabase";

export async function proxy(request: NextRequest) {
  // Overwrite caller input: page guards only use this value to restore an internal destination.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-mayone-admin-path", request.nextUrl.pathname);
  const nextResponse = () => NextResponse.next({ request: { headers: requestHeaders } });
  const config = getSupabaseAuthPublicConfig();
  if (!config) return nextResponse();

  let response = nextResponse();
  const supabase = createServerClient<Database>(config.url, config.publishableKey, {
    auth: { flowType: "pkce" },
    cookieOptions: { httpOnly: true, sameSite: "lax", secure: process.env.VERCEL_ENV === "production" },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        const previousCookies = response.cookies.getAll();
        const previousHeaders = new Headers(response.headers);
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        requestHeaders.set("cookie", request.cookies.toString());
        response = nextResponse();
        for (const cookie of previousCookies) response.cookies.set(cookie);
        for (const name of ["Cache-Control", "Expires", "Pragma"]) {
          const value = previousHeaders.get(name);
          if (value) response.headers.set(name, value);
        }
        for (const [name, value] of Object.entries(headers)) response.headers.set(name, value);
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
      },
    },
  });

  try {
    await supabase.auth.getClaims();
  } catch {
    // Route/page guards verify access independently; Proxy only refreshes the session.
  }
  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
