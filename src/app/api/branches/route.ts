import { jsonResponse, readJsonRequestBody } from "@/lib/http";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { checkAdminApiRequest } from "@/lib/admin-auth";
import { parseAdminBranchInput } from "@/lib/admin-branch-input";
import { createLocalBranch } from "@/lib/local-branch-store";
import { getAdminBranchCatalog } from "@/content/local-branches";
import { createAuthenticatedSupabaseBranch, createSupabaseBranch, hasSupabaseStorageConfiguration } from "@/lib/supabase-storage";

export const runtime = "nodejs";

const MAX_REQUEST_BYTES = 16_000;
const localBranchPath = join(process.cwd(), ".local-data", "branches.json");

async function readBranchInput(request: Request): Promise<{ input?: unknown; response?: Response }> {
  const parsed = await readJsonRequestBody(request, MAX_REQUEST_BYTES);
  if (parsed.response) return { response: parsed.response };
  const body = parsed.body;
  if (typeof body !== "object" || body === null || Array.isArray(body) || !("branch" in body)) {
    return { response: jsonResponse({ message: "지점 정보를 확인해 주세요." }, 400) };
  }
  return { input: body.branch };
}

export async function POST(request: Request): Promise<Response> {
  const authorizationError = await checkAdminApiRequest(request, true, { allowProductionContentChanges: true });
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
      const created = process.env.VERCEL_ENV === "production"
        ? await createAuthenticatedSupabaseBranch(parsedBranch.branch)
        : await createSupabaseBranch(parsedBranch.branch);
      return created
        ? jsonResponse({ ok: true, branchId }, 201)
        : jsonResponse({ message: "같은 ID의 지점이 이미 있습니다." }, 409);
    }

    const created = await createLocalBranch(localBranchPath, await getAdminBranchCatalog(), parsedBranch.branch);
    return created
      ? jsonResponse({ ok: true, branchId }, 201)
      : jsonResponse({ message: "같은 ID의 지점이 이미 있습니다." }, 409);
  } catch {
    return jsonResponse({ message: "지점 정보를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요." }, 500);
  }
}
