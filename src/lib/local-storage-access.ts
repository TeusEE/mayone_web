import { isLocalAdminHost } from "@/lib/local-admin";
import { jsonResponse } from "@/lib/http";

export function checkLocalStorageRequest(request: Request): Response | null {
  if (process.env.NODE_ENV !== "development" || !isLocalAdminHost(request.headers.get("host"))) {
    return jsonResponse({ message: "로컬 개발 서버에서만 사용할 수 있습니다." }, 404);
  }
  return null;
}
