import { getAdminReturnPath, isUnauthenticatedAuthError, normalizeAdminEmail, parseAdminEmailAllowlist, validateAdminPassword } from "@/lib/admin-access";
import { checkSameOriginRequest, getRequestOrigin, readJsonRequestBody } from "@/lib/http";
import { getSupabaseAuthPublicConfig } from "@/lib/supabase/auth-config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminEmailAllowed } from "@/lib/admin-auth";
import { isSupabaseStorageConfigured } from "@/lib/supabase-storage";

export const runtime = "nodejs";

const actions = new Set(["login", "recovery", "password", "logout", "session"]);
const recoveryMessage = "등록된 관리자 계정이 있다면 비밀번호 설정 링크를 보냈습니다. 받은메일함과 스팸함을 확인해 주세요.";

export async function POST(request: Request, context: { params: Promise<{ action: string }> }): Promise<Response> {
  const headers = new Headers({
    "Cache-Control": "private, no-store",
    "Referrer-Policy": "no-referrer",
  });
  const reply = (body: Record<string, unknown>, status = 200) => Response.json(body, { status, headers });
  const { action } = await context.params;
  if (!actions.has(action)) return reply({ message: "요청한 인증 기능이 없습니다." }, 404);
  const originError = checkSameOriginRequest(request, true);
  if (originError) return originError;
  if (!getSupabaseAuthPublicConfig()) return reply({ message: "관리자 인증 설정을 확인해 주세요." }, 503);

  // Logout must remain available when an administrator's access has been removed.
  if (action !== "logout" && (process.env.VERCEL_ENV === "production"
    ? !isSupabaseStorageConfigured()
    : !parseAdminEmailAllowlist(process.env.ADMIN_EMAIL_ALLOWLIST).size)) {
    return reply({ message: "관리자 인증 설정을 확인해 주세요." }, 503);
  }
  const parsed = await readJsonRequestBody(request, action === "session" ? 24_576 : 4_096);
  if (parsed.response) return parsed.response;
  if (!parsed.body || typeof parsed.body !== "object" || Array.isArray(parsed.body)) {
    return reply({ message: "제출 내용을 확인해 주세요." }, 400);
  }
  const body = parsed.body as Record<string, unknown>;

  try {
    const supabase = await createSupabaseServerClient(headers);
    if (action === "logout") {
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error && !isUnauthenticatedAuthError(error)) return reply({ message: "로그아웃하지 못했습니다. 다시 시도해 주세요." }, 503);
      return reply({ redirectTo: "/admin/login" });
    }

    if (action === "login" || action === "recovery") {
      const email = normalizeAdminEmail(body.email);
      if (!email) return reply({ message: "관리자 이메일을 확인해 주세요." }, 400);
      if (action === "recovery") {
        // Do not disclose whether an email belongs to an administrator or send to other accounts.
        if (await isAdminEmailAllowed(email)) {
          const redirectTo = new URL("/auth/callback", getRequestOrigin(request)!).toString();
          const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
          if (error) return reply({ message: "메일을 요청하지 못했습니다. 잠시 후 다시 시도해 주세요." }, error.status === 429 ? 429 : 503);
        }
        return reply({ message: recoveryMessage });
      }
      if (typeof body.password !== "string" || !body.password || body.password.length > 1024) {
        return reply({ message: "비밀번호를 입력해 주세요." }, 400);
      }
      if (!await isAdminEmailAllowed(email)) return reply({ message: "이메일 또는 비밀번호를 확인해 주세요." }, 401);
      const { error } = await supabase.auth.signInWithPassword({ email, password: body.password });
      if (error) {
        const status = error.status === 429 ? 429 : error.status && error.status >= 500 ? 503 : 401;
        return reply({ message: status === 401 ? "이메일 또는 비밀번호를 확인해 주세요." : "로그인하지 못했습니다. 잠시 후 다시 시도해 주세요." }, status);
      }
    }

    if (action === "session") {
      // Bridge legacy email links into the same server cookie session without browser token storage.
      if ((body.type !== "invite" && body.type !== "recovery") ||
          typeof body.accessToken !== "string" || !body.accessToken || body.accessToken.length > 16_384 ||
          typeof body.refreshToken !== "string" || !body.refreshToken || body.refreshToken.length > 2_048) {
        return reply({ message: "인증 링크를 확인해 주세요." }, 400);
      }
      const { error } = await supabase.auth.setSession({ access_token: body.accessToken, refresh_token: body.refreshToken });
      if (error) return reply({ message: "인증 링크가 만료되었거나 올바르지 않습니다. 설정 메일을 다시 요청해 주세요." }, 401);
    }

    // Always verify the current Auth user; a decoded cookie or client supplied email is insufficient.
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return reply({ message: "로그인 상태를 확인할 수 없습니다. 다시 로그인해 주세요." }, error && !isUnauthenticatedAuthError(error) ? 503 : 401);
    }
    if (!await isAdminEmailAllowed(data.user.email)) {
      await supabase.auth.signOut({ scope: "local" });
      return reply({ message: "관리자 권한이 없는 계정입니다." }, 403);
    }

    if (action === "password") {
      const passwordError = validateAdminPassword(body.password, body.confirmation);
      if (passwordError) return reply({ message: passwordError }, 400);
      const { error: updateError } = await supabase.auth.updateUser({ password: body.password as string });
      if (updateError) {
        const message = updateError.code === "same_password" ? "현재 비밀번호와 다른 비밀번호를 입력해 주세요."
          : updateError.code === "weak_password" ? "더 안전한 비밀번호를 입력해 주세요."
          : "비밀번호를 저장하지 못했습니다. 로그인 상태를 확인하고 다시 시도해 주세요.";
        return reply({ message }, isUnauthenticatedAuthError(updateError) ? 401 : 400);
      }
    }
    return reply({ redirectTo: action === "session" ? "/admin/complete-invite" : getAdminReturnPath(body.next) });
  } catch {
    return reply({ message: "인증 서비스를 연결하지 못했습니다. 잠시 후 다시 시도해 주세요." }, 503);
  }
}
