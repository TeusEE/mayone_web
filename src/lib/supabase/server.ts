import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";
import { getSupabaseAuthPublicConfig } from "@/lib/supabase/auth-config";

export async function createSupabaseServerClient(responseHeaders?: Headers) {
  const config = getSupabaseAuthPublicConfig();
  if (!config) throw new Error("Supabase Auth 환경변수를 확인해 주세요.");

  const cookieStore = await cookies();
  return createServerClient<Database>(config.url, config.publishableKey, {
    auth: { flowType: "pkce" },
    cookieOptions: { httpOnly: true, sameSite: "lax", secure: process.env.VERCEL_ENV === "production" },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const [name, value] of Object.entries(headers)) responseHeaders?.set(name, value);
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components cannot write cookies; src/proxy.ts refreshes sessions.
        }
      },
    },
  });
}
