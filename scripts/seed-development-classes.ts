import { readFile } from "node:fs/promises";
import { loadEnvFile } from "node:process";
import { join } from "node:path";
import { createSupabaseAcademyClass, getSupabaseAcademyClasses, getSupabaseDataTarget, isSupabaseStorageConfigured } from "../src/lib/supabase-storage";
import type { AcademyClass } from "../src/types/content";

// This command is intentionally restricted to this project's development database.
const developmentHost = "vmhydtjwvfyedxfloqhn.supabase.co";

async function main() {
  loadEnvFile(join(process.cwd(), ".env.local"));
  if (process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production"
    || getSupabaseDataTarget() !== "test" || !isSupabaseStorageConfigured()) {
    throw new Error("개발 샘플은 Supabase test 환경에서만 추가할 수 있습니다.");
  }
  const url = process.env.SUPABASE_URL?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!url || new URL(url).hostname !== developmentHost) {
    throw new Error("지정된 개발 Supabase 프로젝트가 아닙니다. DB에는 쓰지 않았습니다.");
  }

  const fixture = JSON.parse(await readFile(join(process.cwd(), "src/content/fixtures/development-academy-classes.json"), "utf8")) as { classes: AcademyClass[] };
  if (!Array.isArray(fixture.classes) || fixture.classes.length === 0) throw new Error("개발 샘플 파일을 확인해 주세요.");
  const ids = new Set<string>();
  for (const item of fixture.classes) {
    if (!item.id.startsWith("dev-sample-") || ids.has(item.id) || item.applicationUrl
      || item.publicationState !== "published" || item.reviewState !== "confirmed" || !item.confirmedAt) {
      throw new Error("개발 샘플 ID·중복·공개 상태·외부 신청 링크를 확인해 주세요.");
    }
    ids.add(item.id);
  }

  let created = 0;
  for (const item of fixture.classes) {
    if (await createSupabaseAcademyClass(item)) created += 1;
  }
  const stored = (await getSupabaseAcademyClasses()).filter((item) => ids.has(item.id));
  if (stored.length !== ids.size) throw new Error("저장 후 샘플 조회 건수가 일치하지 않습니다.");
  console.log(`개발 교육 샘플 준비 완료: 신규 ${created}개, 기존 ${ids.size - created}개 보존, 총 ${stored.length}개 조회 확인`);
  console.log("http://localhost:3000/haru/classes 에서 확인할 수 있습니다.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "개발 샘플 추가에 실패했습니다.");
  process.exitCode = 1;
});
