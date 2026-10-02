import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { appendMockEnrollmentCsv, deleteMockEnrollmentCsv, groupMockEnrollmentRecordsByCourse, MOCK_ENROLLMENT_CSV_HEADERS, parseMockEnrollmentCsv, readMockEnrollmentCsv, serializeMockEnrollmentCsvRow, updateMockEnrollmentCsv } from "../src/lib/mock-enrollment-csv";
import { isLocalAdminHost } from "../src/lib/local-admin";

const baseRecord = {
  submittedAt: "2026-09-30T02:30:00.000Z",
  submissionId: "test-submission-001",
  classId: "demo-cut-basics",
  classTitle: "테스트 커트 과정",
  name: "테스트 수강생",
  phone: "01012345678",
  salon: "",
  experience: "테스트 경력",
  inquiry: "테스트 문의",
  testDataAcknowledged: true,
};

const courseGroups = groupMockEnrollmentRecordsByCourse([
  { ...baseRecord, submissionId: "older-cut", submittedAt: "2026-09-29T02:30:00.000Z" },
  { ...baseRecord, submissionId: "latest-cut", submittedAt: "2026-10-02T02:30:00.000Z", classTitle: "수정된 커트 과정" },
  { ...baseRecord, submissionId: "color-applicant", classId: "demo-color-intro", classTitle: "테스트 컬러 과정", submittedAt: "2026-10-01T02:30:00.000Z" },
]);
assert.deepEqual(courseGroups.map((group) => group.classId), ["demo-cut-basics", "demo-color-intro"], "course groups are ordered by their latest submission");
assert.equal(courseGroups[0].classTitle, "수정된 커트 과정", "a group uses the latest recorded course title");
assert.deepEqual(courseGroups[0].records.map((record) => record.submissionId), ["latest-cut", "older-cut"], "applicants inside a course are ordered newest first");

const quotedRow = serializeMockEnrollmentCsvRow({
  ...baseRecord,
  name: "=SUM(1,1)",
  salon: '매장, "테스트"',
  inquiry: "첫 줄\n둘째 줄",
});
assert.ok(quotedRow.includes("\"'=SUM(1,1)\""), "spreadsheet formulas are prefixed with an apostrophe");
assert.ok(quotedRow.includes('"매장, ""테스트"""'), "commas and quotes are CSV escaped");
assert.ok(quotedRow.includes('"첫 줄\n둘째 줄"'), "line breaks remain inside a quoted CSV cell");
const roundTripRecord = { ...baseRecord, salon: '매장, "테스트"', inquiry: "첫 줄\n둘째 줄" };
assert.deepEqual(
  parseMockEnrollmentCsv(`\uFEFF${MOCK_ENROLLMENT_CSV_HEADERS.join(",")}\r\n${serializeMockEnrollmentCsvRow(roundTripRecord)}\r\n`),
  [roundTripRecord],
  "CSV parsing restores commas, quotes, embedded line breaks, and UTF-8 BOM data",
);

assert.equal(isLocalAdminHost("localhost:3000"), true, "localhost is accepted for the local admin route");
assert.equal(isLocalAdminHost("127.0.0.1:3000"), true, "IPv4 loopback is accepted for the local admin route");
assert.equal(isLocalAdminHost("[::1]:3000"), true, "IPv6 loopback is accepted for the local admin route");
assert.equal(isLocalAdminHost("192.168.1.20:3000"), false, "LAN hosts are rejected");
assert.equal(isLocalAdminHost("admin.example.com"), false, "public host names are rejected");
assert.equal(isLocalAdminHost("localhost.attacker.example"), false, "lookalike host names are rejected");

async function main() {
  const tempDirectory = await mkdtemp(join(tmpdir(), "mayone-enrollment-csv-"));
  try {
    const filePath = join(tempDirectory, "nested", "applications.csv");
    const records = Array.from({ length: 12 }, (_, index) => ({
      ...baseRecord,
      submissionId: `test-submission-${String(index + 1).padStart(3, "0")}`,
    }));
    await Promise.all(records.map((record) => appendMockEnrollmentCsv(filePath, record)));

    const csv = await readFile(filePath, "utf8");
    assert.ok(csv.startsWith(`\uFEFF${MOCK_ENROLLMENT_CSV_HEADERS.join(",")}\r\n`), "a new file has a UTF-8 BOM and the expected header");
    assert.equal(csv.split("\r\n").filter(Boolean).length, records.length + 1, "concurrent submissions append one complete row each");
    for (const record of records) assert.ok(csv.includes(record.submissionId), `row ${record.submissionId} was stored`);
    assert.equal((await readMockEnrollmentCsv(filePath)).length, records.length, "the admin reader loads the appended submissions");
    assert.deepEqual(await readMockEnrollmentCsv(join(tempDirectory, "missing.csv")), [], "a missing local CSV is an empty application list");

    const editedId = records[0].submissionId;
    const editedValues = {
      name: "수정한 테스트 수강생",
      phone: "01098765432",
      salon: "수정 테스트 매장",
      experience: "수정 테스트 경력",
      inquiry: "수정된 문의 내용",
    };
    assert.equal(await updateMockEnrollmentCsv(filePath, editedId, editedValues), true, "an existing test submission can be updated");
    const editedRecord = (await readMockEnrollmentCsv(filePath)).find((record) => record.submissionId === editedId);
    assert.ok(editedRecord, "the edited row remains in the CSV");
    assert.deepEqual(
      { name: editedRecord.name, phone: editedRecord.phone, salon: editedRecord.salon, experience: editedRecord.experience, inquiry: editedRecord.inquiry },
      editedValues,
      "editable applicant fields are replaced",
    );
    assert.equal(editedRecord.submittedAt, records[0].submittedAt, "editing preserves the original submission time");
    assert.equal(editedRecord.classId, records[0].classId, "editing preserves the selected course");
    assert.equal(await updateMockEnrollmentCsv(filePath, "missing-submission", editedValues), false, "an unknown submission cannot be updated");

    const deletedId = records[1].submissionId;
    assert.equal(await deleteMockEnrollmentCsv(filePath, deletedId), true, "an existing test submission can be deleted");
    assert.equal((await readMockEnrollmentCsv(filePath)).some((record) => record.submissionId === deletedId), false, "the deleted row is removed from the CSV");
    assert.equal((await readMockEnrollmentCsv(filePath)).length, records.length - 1, "deleting one row leaves other submissions intact");
    assert.equal(await deleteMockEnrollmentCsv(filePath, deletedId), false, "an already deleted submission is not reported as deleted twice");

    const singleRecordFile = join(tempDirectory, "single.csv");
    await appendMockEnrollmentCsv(singleRecordFile, baseRecord);
    assert.equal(await deleteMockEnrollmentCsv(singleRecordFile, baseRecord.submissionId), true, "the last submission can be deleted");
    assert.deepEqual(await readMockEnrollmentCsv(singleRecordFile), [], "deleting the last row leaves a valid empty CSV");

    const corruptFile = join(tempDirectory, "corrupt.csv");
    await writeFile(corruptFile, "unexpected,header\r\n", "utf8");
    await assert.rejects(appendMockEnrollmentCsv(corruptFile, baseRecord), /헤더/u, "an unexpected existing schema is not overwritten");
    await assert.rejects(updateMockEnrollmentCsv(corruptFile, baseRecord.submissionId, editedValues), /헤더/u, "an unexpected CSV schema is not overwritten by update");
    await assert.rejects(deleteMockEnrollmentCsv(corruptFile, baseRecord.submissionId), /헤더/u, "an unexpected CSV schema is not overwritten by delete");
    await assert.rejects(readMockEnrollmentCsv(corruptFile), /헤더/u, "an unexpected CSV schema is not shown as applicant data");
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }

  console.log("신청 CSV 테스트 통과: 저장·수정·삭제·과정별 묶음·파싱 왕복·Host 접근 제한·수식 방어·동시 저장·스키마 보호");
}

void main();
