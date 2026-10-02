import { join } from "node:path";
import { checkLocalAdminMutationRequest } from "@/lib/local-admin-mutation";
import { parseAdminBranchInput } from "@/lib/admin-branch-input";
import { deleteLocalBranch, updateLocalBranch } from "@/lib/local-branch-store";
import { getLocalBranchCatalog } from "@/content/local-branches";
import { deleteSupabaseBranch, getSupabaseBranches, hasSupabaseStorageConfiguration, isSupabaseStorageConfigured, updateSupabaseBranch } from "@/lib/supabase-storage";

export const runtime = "nodejs";

const MAX_REQUEST_BYTES = 16_000;
const localBranchPath = join(process.cwd(), ".local-data", "branches.json");
const branchIdPattern = /^[a-z0-9][a-z0-9-]{1,99}$/u;

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

async function readBranchId(context: { params: Promise<{ branchId: string }> }): Promise<string> {
  const { branchId } = await context.params;
  return branchId;
}

export async function PUT(request: Request, context: { params: Promise<{ branchId: string }> }): Promise<Response> {
  const authorizationError = checkLocalAdminMutationRequest(request, true);
  if (authorizationError) return authorizationError;

  const branchId = await readBranchId(context);
  if (!branchIdPattern.test(branchId)) return jsonResponse({ message: "지점을 찾을 수 없습니다." }, 404);

  const parsedInput = await readBranchInput(request);
  if (parsedInput.response) return parsedInput.response;

  try {
    const useSupabase = hasSupabaseStorageConfiguration();
    if (useSupabase && !isSupabaseStorageConfigured()) return jsonResponse({ message: "Supabase 환경변수를 확인해 주세요." }, 503);
    const currentBranches = useSupabase ? await getSupabaseBranches() : await getLocalBranchCatalog();
    const existing = currentBranches.find((branch) => branch.id === branchId);
    if (!existing) return jsonResponse({ message: "지점을 찾을 수 없습니다." }, 404);

    const parsedBranch = parseAdminBranchInput(parsedInput.input, branchId, existing);
    if (!parsedBranch.branch) {
      return jsonResponse({ message: "입력한 지점 정보를 확인해 주세요.", errors: parsedBranch.errors }, 422);
    }

    const updated = useSupabase
      ? await updateSupabaseBranch(branchId, parsedBranch.branch)
      : await updateLocalBranch(localBranchPath, currentBranches, branchId, parsedBranch.branch);
    return updated ? jsonResponse({ ok: true }, 200) : jsonResponse({ message: "지점을 찾을 수 없습니다." }, 404);
  } catch {
    return jsonResponse({ message: "로컬 지점 정보를 수정하지 못했습니다. JSON 형식과 저장 경로를 확인해 주세요." }, 500);
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ branchId: string }> }): Promise<Response> {
  const authorizationError = checkLocalAdminMutationRequest(request, false);
  if (authorizationError) return authorizationError;

  const branchId = await readBranchId(context);
  if (!branchIdPattern.test(branchId)) return jsonResponse({ message: "지점을 찾을 수 없습니다." }, 404);

  try {
    const useSupabase = hasSupabaseStorageConfiguration();
    if (useSupabase && !isSupabaseStorageConfigured()) return jsonResponse({ message: "Supabase 환경변수를 확인해 주세요." }, 503);
    const deleted = useSupabase
      ? await deleteSupabaseBranch(branchId)
      : await deleteLocalBranch(localBranchPath, await getLocalBranchCatalog(), branchId);
    return deleted ? jsonResponse({ ok: true }, 200) : jsonResponse({ message: "지점을 찾을 수 없습니다." }, 404);
  } catch {
    return jsonResponse({ message: "로컬 지점 정보를 삭제하지 못했습니다. JSON 형식과 저장 경로를 확인해 주세요." }, 500);
  }
}
