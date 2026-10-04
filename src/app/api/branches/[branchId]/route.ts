import { jsonResponse, readJsonRequestBody } from "@/lib/http";
import { join } from "node:path";
import { checkAdminApiRequest } from "@/lib/admin-auth";
import { parseAdminBranchInput } from "@/lib/admin-branch-input";
import { deleteLocalBranch, updateLocalBranch } from "@/lib/local-branch-store";
import { getAdminBranchCatalog } from "@/content/local-branches";
import { deleteSupabaseBranch, getSupabaseBranches, hasSupabaseStorageConfiguration, updateAuthenticatedSupabaseBranch, updateSupabaseBranch } from "@/lib/supabase-storage";

export const runtime = "nodejs";

const MAX_REQUEST_BYTES = 16_000;
const localBranchPath = join(process.cwd(), ".local-data", "branches.json");
const branchIdPattern = /^[a-z0-9][a-z0-9-]{1,99}$/u;

async function readBranchInput(request: Request): Promise<{ input?: unknown; response?: Response }> {
  const parsed = await readJsonRequestBody(request, MAX_REQUEST_BYTES);
  if (parsed.response) return { response: parsed.response };
  const body = parsed.body;
  if (typeof body !== "object" || body === null || Array.isArray(body) || !("branch" in body)) {
    return { response: jsonResponse({ message: "지점 정보를 확인해 주세요." }, 400) };
  }
  return { input: body.branch };
}

async function readBranchId(context: { params: Promise<{ branchId: string }> }): Promise<string> {
  const { branchId } = await context.params;
  return branchId;
}

export async function PUT(request: Request, context: { params: Promise<{ branchId: string }> }): Promise<Response> {
  const authorizationError = await checkAdminApiRequest(request, true, { allowProductionContentChanges: true });
  if (authorizationError) return authorizationError;

  const branchId = await readBranchId(context);
  if (!branchIdPattern.test(branchId)) return jsonResponse({ message: "지점을 찾을 수 없습니다." }, 404);

  const parsedInput = await readBranchInput(request);
  if (parsedInput.response) return parsedInput.response;

  try {
    const useSupabase = hasSupabaseStorageConfiguration();
    const currentBranches = useSupabase ? await getSupabaseBranches() : await getAdminBranchCatalog();
    const existing = currentBranches.find((branch) => branch.id === branchId);
    if (!existing) return jsonResponse({ message: "지점을 찾을 수 없습니다." }, 404);

    const parsedBranch = parseAdminBranchInput(parsedInput.input, branchId, existing);
    if (!parsedBranch.branch) {
      return jsonResponse({ message: "입력한 지점 정보를 확인해 주세요.", errors: parsedBranch.errors }, 422);
    }

    const updated = useSupabase
      ? process.env.VERCEL_ENV === "production"
        ? await updateAuthenticatedSupabaseBranch(branchId, parsedBranch.branch)
        : await updateSupabaseBranch(branchId, parsedBranch.branch)
      : await updateLocalBranch(localBranchPath, currentBranches, branchId, parsedBranch.branch);
    return updated ? jsonResponse({ ok: true }, 200) : jsonResponse({ message: "지점을 찾을 수 없습니다." }, 404);
  } catch {
    return jsonResponse({ message: "지점 정보를 수정하지 못했습니다. 잠시 후 다시 시도해 주세요." }, 500);
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ branchId: string }> }): Promise<Response> {
  const authorizationError = await checkAdminApiRequest(request, false);
  if (authorizationError) return authorizationError;

  const branchId = await readBranchId(context);
  if (!branchIdPattern.test(branchId)) return jsonResponse({ message: "지점을 찾을 수 없습니다." }, 404);

  try {
    const useSupabase = hasSupabaseStorageConfiguration();
    const deleted = useSupabase
      ? await deleteSupabaseBranch(branchId)
      : await deleteLocalBranch(localBranchPath, await getAdminBranchCatalog(), branchId);
    return deleted ? jsonResponse({ ok: true }, 200) : jsonResponse({ message: "지점을 찾을 수 없습니다." }, 404);
  } catch {
    return jsonResponse({ message: "지점 정보를 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요." }, 500);
  }
}
