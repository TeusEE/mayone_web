import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { checkLocalAdminMutationRequest } from "@/lib/local-admin-mutation";
import { parseAdminBranchInput } from "@/lib/admin-branch-input";
import { createLocalBranch } from "@/lib/local-branch-store";
import { getLocalBranchCatalog } from "@/content/local-branches";
import { createSupabaseBranch, hasSupabaseStorageConfiguration, isSupabaseStorageConfigured } from "@/lib/supabase-storage";

export const runtime = "nodejs";

const MAX_REQUEST_BYTES = 16_000;
const localBranchPath = join(process.cwd(), ".local-data", "branches.json");

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

async function readBranchInput(request: Request): Promise<{ input?: unknown; response?: Response }> {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return { response: jsonResponse({ message: "지점 정보가 너무 큽니다." }, 413) };
  }

  try {
    const bodyText = await request.text();
    if (new TextEncoder().encode(bodyText).byteLength > MAX_REQUEST_BYTES) {
      return { response: jsonResponse({ message: "지점 정보가 너무 큽니다." }, 413) };
    }
    const body: unknown = JSON.parse(bodyText);
    if (typeof body !== "object" || body === null || Array.isArray(body) || !("branch" in body)) {
      return { response: jsonResponse({ message: "지점 정보를 확인해 주세요." }, 400) };
    }
    return { input: body.branch };
  } catch {
    return { response: jsonResponse({ message: "지점 정보를 읽지 못했습니다." }, 400) };
  }
}

export async function POST(request: Request): Promise<Response> {
  const authorizationError = checkLocalAdminMutationRequest(request, true);
  if (authorizationError) return authorizationError;

  const parsedInput = await readBranchInput(request);
  if (parsedInput.response) return parsedInput.response;

  const branchId = `branch-${randomUUID()}`;
  const parsedBranch = parseAdminBranchInput(parsedInput.input, branchId);
  if (!parsedBranch.branch) {
    return jsonResponse({ message: "입력한 지점 정보를 확인해 주세요.", errors: parsedBranch.errors }, 422);
  }

  try {
    if (hasSupabaseStorageConfiguration()) {
      if (!isSupabaseStorageConfigured()) return jsonResponse({ message: "Supabase 환경변수를 확인해 주세요." }, 503);
      const created = await createSupabaseBranch(parsedBranch.branch);
      return created
        ? jsonResponse({ ok: true, branchId }, 201)
        : jsonResponse({ message: "같은 ID의 지점이 이미 있습니다." }, 409);
    }

    const created = await createLocalBranch(localBranchPath, await getLocalBranchCatalog(), parsedBranch.branch);
    return created
      ? jsonResponse({ ok: true, branchId }, 201)
      : jsonResponse({ message: "같은 ID의 지점이 이미 있습니다." }, 409);
  } catch {
    return jsonResponse({ message: "로컬 지점 정보를 저장하지 못했습니다. JSON 파일과 저장 경로를 확인해 주세요." }, 500);
  }
}
