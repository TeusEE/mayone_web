import { getAdminReturnPath } from "@/lib/admin-access";

type AdminAuthAction = "login" | "recovery" | "password" | "logout" | "session";

export async function submitAdminAuth(action: AdminAuthAction, body: Record<string, unknown>) {
  const response = await fetch(`/api/admin/auth/${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    cache: "no-store",
    body: JSON.stringify(body),
  });
  const result: unknown = await response.json();
  if (!result || typeof result !== "object") throw new Error("응답을 확인하지 못했습니다. 다시 시도해 주세요.");
  const data = result as Record<string, unknown>;
  const message = typeof data.message === "string" ? data.message : "요청을 처리하지 못했습니다. 다시 시도해 주세요.";
  if (!response.ok) throw new Error(message);
  return {
    message,
    redirectTo: data.redirectTo === "/admin/login" ? "/admin/login" : getAdminReturnPath(data.redirectTo),
  };
}

export function getAdminAuthError(error: unknown): string {
  return error instanceof Error && error.name !== "TypeError"
    ? error.message
    : "연결하지 못했습니다. 잠시 후 다시 시도해 주세요.";
}
