import { randomUUID } from "node:crypto";
import { checkAdminApiRequest } from "@/lib/admin-auth";
import { parseAdminAcademyClassInput } from "@/lib/admin-academy-class-input";
import { jsonResponse, readJsonRequestBody } from "@/lib/http";
import {
  createAuthenticatedSupabaseAcademyClass,
  createSupabaseAcademyClass,
  hasSupabaseStorageConfiguration,
} from "@/lib/supabase-storage";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const authorizationError = await checkAdminApiRequest(request, true, { allowProductionContentChanges: true });
  if (authorizationError) return authorizationError;

  const parsed = await readJsonRequestBody(request, 24_000);
  if (parsed.response) return parsed.response;
  if (typeof parsed.body !== "object" || parsed.body === null || Array.isArray(parsed.body) || !("classItem" in parsed.body)) {
    return jsonResponse({ message: "교육 과정 정보를 확인해 주세요." }, 400);
  }

  const classId = `class-${randomUUID()}`;
  const result = parseAdminAcademyClassInput(parsed.body.classItem, classId);
  if (!result.item) return jsonResponse({ message: "입력한 교육 정보를 확인해 주세요.", errors: result.errors }, 422);

  try {
    if (!hasSupabaseStorageConfiguration()) {
      return jsonResponse({ message: "운영 과정은 Supabase 저장소가 필요합니다." }, 503);
    }
    const created = process.env.VERCEL_ENV === "production"
      ? await createAuthenticatedSupabaseAcademyClass(result.item)
      : await createSupabaseAcademyClass(result.item);
    return created
      ? jsonResponse({ ok: true, classId }, 201)
      : jsonResponse({ message: "같은 ID의 과정이 이미 있습니다." }, 409);
  } catch {
    return jsonResponse({ message: "교육 과정을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요." }, 500);
  }
}
