import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminEmailAllowed } from "@/lib/admin-auth";
import { getRequestOrigin } from "@/lib/http";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const code = request.nextUrl.searchParams.get("code");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  const responseHeaders = new Headers({ "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" });
  const redirectTo = (path: string, clearFragment = true) => {
    const url = new URL(path, getRequestOrigin(request) ?? request.url);
    // HTTP redirects otherwise inherit a legacy token fragment from the incoming link.
    if (clearFragment) url.hash = "#";
    const response = NextResponse.redirect(url);
    for (const [name, value] of responseHeaders) response.headers.set(name, value);
    return response;
  };
  if (request.nextUrl.searchParams.has("error")) return redirectTo("/admin/login?error=invite-link");
  if (!code && !tokenHash) return redirectTo("/admin/auth-link", false);
  if ((code && tokenHash) || (tokenHash && type !== "invite" && type !== "recovery")) {
    return redirectTo("/admin/login?error=invite-link");
  }

  try {
    const supabase = await createSupabaseServerClient(responseHeaders);
    const result = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : await supabase.auth.verifyOtp({ token_hash: tokenHash!, type: type as "invite" | "recovery" });
    if (result.error) return redirectTo("/admin/login?error=invite-link");
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return redirectTo("/admin/login?error=verification");
    if (!await isAdminEmailAllowed(data.user.email)) {
      await supabase.auth.signOut({ scope: "local" });
      return redirectTo("/admin/login?error=not-allowlisted");
    }
    return redirectTo("/admin/complete-invite");
  } catch {
    return redirectTo("/admin/login?error=verification");
  }
}
