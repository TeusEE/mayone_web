import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseMockClassOffers } from "../src/lib/mock-class-offers";
import { createMockClassOffer, deleteMockClassOffer, updateMockClassOffer } from "../src/lib/mock-class-offer-store";

async function main() {
  const fixturePath = join(process.cwd(), "src/content/fixtures/class-offers.csv");
  const fixture = parseMockClassOffers(await readFile(fixturePath, "utf8"));
  assert.deepEqual(fixture.errors, [], "the fallback catalog is valid");
  const baseOffer = fixture.offers[0];
  const directory = await mkdtemp(join(tmpdir(), "mayone-class-offers-"));
  const localPath = join(directory, "nested", "mock-class-offers.csv");

  try {
    const addedOffer = { ...baseOffer, id: "course-test-added", title: "테스트 추가 과목" };
    assert.equal(await createMockClassOffer(localPath, fixturePath, addedOffer), true, "creating a course seeds from the fixture and adds one row");
    const firstCsv = await readFile(localPath, "utf8");
    assert.ok(firstCsv.startsWith("\uFEFFid,title,category"), "the local course file includes a UTF-8 BOM and the expected header");
    assert.equal(parseMockClassOffers(firstCsv).offers.length, fixture.offers.length + 1, "the local catalog contains the fixture courses and new course");

    const updatedOffer = { ...addedOffer, title: "수정한 테스트 과목", summary: "수정된 소개" };
    assert.equal(await updateMockClassOffer(localPath, fixturePath, addedOffer.id, updatedOffer), true, "an existing course can be updated");
    const updatedCatalog = parseMockClassOffers(await readFile(localPath, "utf8"));
    assert.equal(updatedCatalog.offers.find((offer) => offer.id === addedOffer.id)?.title, updatedOffer.title, "the updated title persists");
    assert.equal(await updateMockClassOffer(localPath, fixturePath, "missing-course", updatedOffer), false, "an unknown course is not updated");

    const concurrentOffers = Array.from({ length: 8 }, (_, index) => ({
      ...baseOffer,
      id: `course-concurrent-${index}`,
      title: `동시 추가 과목 ${index}`,
    }));
    const concurrentResults = await Promise.all(concurrentOffers.map((offer) => createMockClassOffer(localPath, fixturePath, offer)));
    assert.ok(concurrentResults.every(Boolean), "concurrent additions are accepted");
    const concurrentCatalog = parseMockClassOffers(await readFile(localPath, "utf8"));
    assert.equal(concurrentCatalog.offers.length, fixture.offers.length + 1 + concurrentOffers.length, "concurrent changes do not overwrite one another");

    assert.equal(await deleteMockClassOffer(localPath, fixturePath, addedOffer.id), true, "an existing course can be deleted");
    for (const offer of concurrentOffers) {
      assert.equal(await deleteMockClassOffer(localPath, fixturePath, offer.id), true, `course ${offer.id} can be deleted`);
    }
    assert.equal(await deleteMockClassOffer(localPath, fixturePath, "missing-course"), false, "an unknown course is not deleted");
    assert.deepEqual(parseMockClassOffers(await readFile(localPath, "utf8")).offers, fixture.offers, "deleting local courses preserves the fixture catalog");

    const corruptPath = join(directory, "corrupt.csv");
    await writeFile(corruptPath, "not,a,valid,catalog\r\n", "utf8");
    const corruptBefore = await readFile(corruptPath, "utf8");
    await assert.rejects(createMockClassOffer(corruptPath, fixturePath, addedOffer), /CSV/u, "an invalid local catalog is not replaced with fixture data");
    assert.equal(await readFile(corruptPath, "utf8"), corruptBefore, "a failed mutation leaves the original corrupt file untouched");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }

  console.log("수강 과목 CSV 테스트 통과: fixture 복사·추가·수정·삭제·동시 변경·오류 파일 보호");
}

void main();
