import { isLocalAdminHost } from "@/lib/local-admin";

export function checkLocalAdminMutationRequest(request: Request, requiresJson: boolean): Response | null {
  if (process.env.NODE_ENV !== "development" || !isLocalAdminHost(request.headers.get("host"))) {
    return Response.json({ message: "로컬 개발 서버에서만 사용할 수 있습니다." }, { status: 404 });
  }

  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    return Response.json({ message: "요청 출처를 확인할 수 없습니다." }, { status: 403 });
  }

  if (requiresJson && !request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return Response.json({ message: "JSON 형식으로 제출해 주세요." }, { status: 415 });
  }

  return null;
}
