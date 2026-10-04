import { checkAdminApiRequest } from "@/lib/admin-auth";
import { parseAdminAcademyClassInput } from "@/lib/admin-academy-class-input";
import { jsonResponse, readJsonRequestBody } from "@/lib/http";
import {
  getSupabaseAcademyClasses,
  hasSupabaseStorageConfiguration,
  updateAuthenticatedSupabaseAcademyClass,
  updateSupabaseAcademyClass,
} from "@/lib/supabase-storage";

export const runtime = "nodejs";
const classIdPattern = /^[a-z0-9][a-z0-9-]{1,99}$/u;

export async function PUT(
  request: Request,
  context: { params: Promise<{ classId: string }> },
): Promise<Response> {
  const authorizationError = await checkAdminApiRequest(request, true, { allowProductionContentChanges: true });
  if (authorizationError) return authorizationError;

  const { classId } = await context.params;
  if (!classIdPattern.test(classId)) return jsonResponse({ message: "교육 과정을 찾을 수 없습니다." }, 404);
  const parsedBody = await readJsonRequestBody(request, 24_000);
  if (parsedBody.response) return parsedBody.response;
  if (typeof parsedBody.body !== "object" || parsedBody.body === null || Array.isArray(parsedBody.body) || !("classItem" in parsedBody.body)) {
    return jsonResponse({ message: "교육 과정 정보를 확인해 주세요." }, 400);
  }

  try {
    if (!hasSupabaseStorageConfiguration()) return jsonResponse({ message: "운영 과정은 Supabase 저장소가 필요합니다." }, 503);
    const existing = (await getSupabaseAcademyClasses()).find((item) => item.id === classId);
    if (!existing) return jsonResponse({ message: "교육 과정을 찾을 수 없습니다." }, 404);
    const result = parseAdminAcademyClassInput(parsedBody.body.classItem, classId, existing);
    if (!result.item) return jsonResponse({ message: "입력한 교육 정보를 확인해 주세요.", errors: result.errors }, 422);
    const updated = process.env.VERCEL_ENV === "production"
      ? await updateAuthenticatedSupabaseAcademyClass(classId, result.item)
      : await updateSupabaseAcademyClass(classId, result.item);
    return updated
      ? jsonResponse({ ok: true }, 200)
      : jsonResponse({ message: "교육 과정을 찾을 수 없습니다." }, 404);
  } catch {
    return jsonResponse({ message: "교육 과정을 수정하지 못했습니다. 잠시 후 다시 시도해 주세요." }, 500);
  }
}
