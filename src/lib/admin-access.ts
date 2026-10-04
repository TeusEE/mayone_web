export type AdminIdentityStatus = "unauthenticated" | "not-allowlisted" | "authorized";

const adminReturnPaths = new Set([
  "/admin", "/admin/enrollments", "/admin/classes", "/admin/branches", "/admin/complete-invite",
]);

export function getAdminReturnPath(value: unknown): string {
  return typeof value === "string" && adminReturnPaths.has(value) ? value : "/admin";
}

export function getAdminLoginPath(next: string, error?: string): string {
  const params = new URLSearchParams({ next: getAdminReturnPath(next) });
  if (error) params.set("error", error);
  return `/admin/login?${params}`;
}

export function normalizeAdminEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email) ? email : null;
}

export function validateAdminPassword(password: unknown, confirmation: unknown): string | null {
  if (typeof password !== "string" || password.length < 12 || password.length > 128) {
    return "비밀번호를 12~128자로 입력해 주세요.";
  }
  return password === confirmation ? null : "두 비밀번호가 일치하지 않습니다.";
}

export function parseAdminEmailAllowlist(value: string | undefined): ReadonlySet<string> {
  return new Set(
    (value ?? "")
      .split(/[\s,]+/u)
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isUnauthenticatedAuthError(input: { name?: string; status?: number }): boolean {
  return input.name === "AuthSessionMissingError" || input.status === 401 || input.status === 403;
}

export function getAdminIdentityStatus(input: {
  userId: string | null;
  email: string | null;
  allowlistedEmails: ReadonlySet<string>;
}): AdminIdentityStatus {
  if (!input.userId) return "unauthenticated";
  const email = input.email?.trim().toLowerCase();
  if (!email || !input.allowlistedEmails.has(email)) return "not-allowlisted";
  return "authorized";
}
