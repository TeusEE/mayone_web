import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { branches as sourceBranches } from "../src/content/branches";
import { parseAdminBranchInput } from "../src/lib/admin-branch-input";
import {
  createLocalBranch,
  deleteLocalBranch,
  parseLocalBranchCatalog,
  readLocalBranchCatalog,
  updateLocalBranch,
} from "../src/lib/local-branch-store";

const input = {
  officialName: "테스트 지점",
  publicationState: "published",
  operationState: "active",
  region: "테스트구",
  address: "서울 테스트구 1길 2",
  introduction: "관리자 흐름을 확인하기 위한 테스트 데이터입니다.",
  hours: "매일 10:00–20:00",
  closedDays: "매주 월요일",
  phone: "0507-1234-5678",
  bookingUrl: "https://example.com/booking",
  placeUrl: "https://example.com/place",
  directions: "테스트역 인근",
  parking: "주차 가능",
  amenitiesText: "헤어스파\n유아의자",
};

const parsed = parseAdminBranchInput(input, "branch-test-created", undefined, new Date("2026-10-02T00:00:00+09:00"));
assert.deepEqual(parsed.errors, [], "complete published branch input passes validation");
assert.ok(parsed.branch);
assert.equal(parsed.branch.reviewState, "confirmed");
assert.equal(parsed.branch.confirmedAt, "2026-10-01T15:00:00.000Z", "publish confirmation receives a zoned timestamp");
assert.deepEqual(parsed.branch.amenities, ["헤어스파", "유아의자"]);

assert.ok(
  parseAdminBranchInput({ ...input, region: "" }, "branch-test-invalid").errors.some((error) => error.includes("지역")),
  "published branches require a region",
);
assert.ok(
  parseAdminBranchInput({ ...input, operationState: "unknown" }, "branch-test-invalid").errors.some((error) => error.includes("운영 상태")),
  "published branches require a confirmed operating state",
);
assert.ok(
  parseAdminBranchInput({ ...input, bookingUrl: "http://example.com/booking" }, "branch-test-invalid").errors.some((error) => error.includes("HTTPS")),
  "booking URLs must use HTTPS",
);
assert.ok(parseAdminBranchInput(input, "Bad Branch Id").errors.some((error) => error.includes("ID")), "branch IDs are validated");
assert.deepEqual(parseLocalBranchCatalog(JSON.stringify({ version: 1, branches: sourceBranches.records })), sourceBranches.records, "checked-in branch records round-trip through the local JSON format");

async function main() {
  const directory = await mkdtemp(join(tmpdir(), "mayone-branches-"));
  const filePath = join(directory, "nested", "branches.json");
  const fallback = sourceBranches.records;

  try {
    assert.deepEqual(await readLocalBranchCatalog(filePath, fallback), fallback, "a missing local file falls back to checked-in branches");
    assert.equal(await createLocalBranch(filePath, fallback, parsed.branch!), true, "creating a branch seeds the local JSON from source branches");
    assert.equal(await createLocalBranch(filePath, fallback, parsed.branch!), false, "duplicate branch IDs are rejected");

    const firstCatalog = await readLocalBranchCatalog(filePath, fallback);
    assert.equal(firstCatalog.length, fallback.length + 1);
    assert.deepEqual(firstCatalog.at(-1), parsed.branch);

    const updated = { ...parsed.branch!, officialName: "수정된 테스트 지점", address: "서울 테스트구 3길 4" };
    assert.equal(await updateLocalBranch(filePath, fallback, parsed.branch!.id, updated), true, "existing branch information can be updated");
    assert.equal((await readLocalBranchCatalog(filePath, fallback)).at(-1)?.officialName, updated.officialName);
    assert.equal(await updateLocalBranch(filePath, fallback, "missing-branch", updated), false, "unknown branches are not updated");

    const concurrent = Array.from({ length: 5 }, (_, index) => ({
      ...parsed.branch!,
      id: `branch-test-${index}`,
      officialName: `동시 등록 지점 ${index}`,
    }));
    const concurrentResults = await Promise.all(concurrent.map((branch) => createLocalBranch(filePath, fallback, branch)));
    assert.ok(concurrentResults.every(Boolean), "concurrent additions are accepted");
    assert.equal((await readLocalBranchCatalog(filePath, fallback)).length, fallback.length + 1 + concurrent.length, "concurrent writes do not overwrite one another");

    assert.equal(await deleteLocalBranch(filePath, fallback, parsed.branch!.id), true, "an existing branch can be deleted");
    for (const branch of concurrent) assert.equal(await deleteLocalBranch(filePath, fallback, branch.id), true);
    assert.equal(await deleteLocalBranch(filePath, fallback, "missing-branch"), false, "unknown branches are not deleted");
    assert.deepEqual(await readLocalBranchCatalog(filePath, fallback), fallback, "deleting local branches preserves the source catalog");

    const corruptPath = join(directory, "corrupt.json");
    const corruptJson = "{not-json";
    await writeFile(corruptPath, corruptJson, "utf8");
    await assert.rejects(createLocalBranch(corruptPath, fallback, parsed.branch!), /지점 JSON/u, "corrupt local data is not overwritten");
    assert.equal(await readFile(corruptPath, "utf8"), corruptJson, "failed mutations preserve a corrupt file for repair");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }

  console.log("지점 관리 테스트 통과: 입력 검증·공개 요건·JSON fallback·추가/수정/삭제·동시 저장·오류 파일 보호");
}

void main();
