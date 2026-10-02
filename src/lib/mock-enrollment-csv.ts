import { randomUUID } from "node:crypto";
import { appendFile, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export const MOCK_ENROLLMENT_CSV_HEADERS = [
  "submitted_at",
  "submission_id",
  "class_id",
  "class_title",
  "name",
  "phone",
  "salon",
  "experience",
  "inquiry",
  "test_data_acknowledged",
] as const;

export interface MockEnrollmentCsvRecord {
  submittedAt: string;
  submissionId: string;
  classId: string;
  classTitle: string;
  name: string;
  phone: string;
  salon: string;
  experience: string;
  inquiry: string;
  testDataAcknowledged: boolean;
}

export interface MockEnrollmentCourseGroup {
  classId: string;
  classTitle: string;
  records: MockEnrollmentCsvRecord[];
}

export type MockEnrollmentEditableValues = Pick<
  MockEnrollmentCsvRecord,
  "name" | "phone" | "salon" | "experience" | "inquiry"
>;

export function groupMockEnrollmentRecordsByCourse(
  records: readonly MockEnrollmentCsvRecord[],
): MockEnrollmentCourseGroup[] {
  const groups = new Map<string, MockEnrollmentCourseGroup>();

  for (const record of records) {
    let group = groups.get(record.classId);
    if (!group) {
      group = { classId: record.classId, classTitle: record.classTitle, records: [] };
      groups.set(record.classId, group);
    }
    group.records.push(record);
  }

  return [...groups.values()]
    .map((group) => {
      const sortedRecords = [...group.records].sort(
        (left, right) => Date.parse(right.submittedAt) - Date.parse(left.submittedAt),
      );
      return {
        ...group,
        classTitle: sortedRecords[0].classTitle,
        records: sortedRecords,
      };
    })
    .sort((left, right) => Date.parse(right.records[0].submittedAt) - Date.parse(left.records[0].submittedAt));
}

const writeQueues = new Map<string, Promise<void>>();
const header = MOCK_ENROLLMENT_CSV_HEADERS.join(",");

function parseCsvRows(csv: string): string[][] {
  const source = csv.charCodeAt(0) === 0xfeff ? csv.slice(1) : csv;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let afterQuote = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];

    if (inQuotes) {
      if (character === '"') {
        if (source[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = false;
          afterQuote = true;
        }
      } else {
        field += character;
      }
      continue;
    }

    if (afterQuote) {
      if (character === ",") {
        row.push(field);
        field = "";
        afterQuote = false;
      } else if (character === "\n" || character === "\r") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
        afterQuote = false;
        if (character === "\r" && source[index + 1] === "\n") index += 1;
      } else {
        throw new Error(`CSV 닫는 따옴표 뒤에 허용되지 않는 문자가 있습니다 (위치 ${index + 1}).`);
      }
      continue;
    }

    if (character === '"') {
      if (field.length > 0) throw new Error(`CSV 따옴표가 올바르게 열리지 않았습니다 (위치 ${index + 1}).`);
      inQuotes = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n" || character === "\r") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      if (character === "\r" && source[index + 1] === "\n") index += 1;
    } else {
      field += character;
    }
  }

  if (inQuotes) throw new Error("CSV 따옴표가 닫히지 않았습니다.");
  if (afterQuote || field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((candidate) => candidate.some((value) => value !== ""));
}

function protectSpreadsheetFormula(value: string): string {
  return /^[\s]*[=+\-@]/u.test(value) ? `'${value}` : value;
}

function serializeCell(value: string): string {
  const safeValue = protectSpreadsheetFormula(value);
  return `"${safeValue.replaceAll('"', '""')}"`;
}

export function serializeMockEnrollmentCsvRow(record: MockEnrollmentCsvRecord): string {
  const values = [
    record.submittedAt,
    record.submissionId,
    record.classId,
    record.classTitle,
    record.name,
    record.phone,
    record.salon,
    record.experience,
    record.inquiry,
    String(record.testDataAcknowledged),
  ];

  return values.map(serializeCell).join(",");
}

export function parseMockEnrollmentCsv(csv: string): MockEnrollmentCsvRecord[] {
  if (!csv.trim()) return [];

  const rows = parseCsvRows(csv);
  if (rows.length === 0 || rows[0].length !== MOCK_ENROLLMENT_CSV_HEADERS.length
    || MOCK_ENROLLMENT_CSV_HEADERS.some((value, index) => rows[0][index] !== value)) {
    throw new Error("신청 데이터 CSV의 헤더가 예상한 형식과 다릅니다.");
  }

  return rows.slice(1).map((row, index) => {
    if (row.length !== MOCK_ENROLLMENT_CSV_HEADERS.length) {
      throw new Error(`신청 데이터 CSV ${index + 2}행의 열 개수가 맞지 않습니다.`);
    }
    const [submittedAt, submissionId, classId, classTitle, name, phone, salon, experience, inquiry, acknowledged] = row;
    if (!Number.isFinite(Date.parse(submittedAt)) || !submissionId || !classId || !classTitle || !name || !/^\d{10,11}$/.test(phone)
      || (acknowledged !== "true" && acknowledged !== "false")) {
      throw new Error(`신청 데이터 CSV ${index + 2}행의 필수 값이 유효하지 않습니다.`);
    }

    return {
      submittedAt,
      submissionId,
      classId,
      classTitle,
      name,
      phone,
      salon,
      experience,
      inquiry,
      testDataAcknowledged: acknowledged === "true",
    };
  });
}

export async function readMockEnrollmentCsv(filePath: string): Promise<MockEnrollmentCsvRecord[]> {
  let csv: string;
  try {
    csv = await readFile(filePath, "utf8");
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") return [];
    throw error;
  }
  return parseMockEnrollmentCsv(csv);
}

async function appendRecord(filePath: string, record: MockEnrollmentCsvRecord): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });

  let existing = "";
  try {
    existing = await readFile(filePath, "utf8");
  } catch (error) {
    if (!error || typeof error !== "object" || !("code" in error) || error.code !== "ENOENT") throw error;
  }

  const row = serializeMockEnrollmentCsvRow(record);
  if (!existing) {
    await appendFile(filePath, `\uFEFF${header}\r\n${row}\r\n`, "utf8");
    return;
  }

  const firstLine = existing.replace(/^\uFEFF/u, "").split(/\r\n|\n|\r/u, 1)[0];
  if (firstLine !== header) throw new Error("신청 데이터 CSV의 헤더가 예상한 형식과 다릅니다.");

  const separator = /[\r\n]$/u.test(existing) ? "" : "\r\n";
  await appendFile(filePath, `${separator}${row}\r\n`, "utf8");
}

async function withFileWriteLock<T>(filePath: string, operation: () => Promise<T>): Promise<T> {
  const key = filePath;
  const previous = writeQueues.get(key) ?? Promise.resolve();
  const current = previous.catch(() => undefined).then(operation);
  const queueTail = current.then(() => undefined, () => undefined);
  writeQueues.set(key, queueTail);

  try {
    return await current;
  } finally {
    if (writeQueues.get(key) === queueTail) writeQueues.delete(key);
  }
}

async function writeAllRecords(filePath: string, records: MockEnrollmentCsvRecord[]): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
  const contents = `\uFEFF${header}\r\n${records.map(serializeMockEnrollmentCsvRow).join("\r\n")}${records.length ? "\r\n" : ""}`;
  const temporaryPath = `${filePath}.${randomUUID()}.tmp`;

  try {
    await writeFile(temporaryPath, contents, "utf8");
    await rename(temporaryPath, filePath);
  } finally {
    await rm(temporaryPath, { force: true });
  }
}

export async function appendMockEnrollmentCsv(filePath: string, record: MockEnrollmentCsvRecord): Promise<void> {
  await withFileWriteLock(filePath, () => appendRecord(filePath, record));
}

export async function updateMockEnrollmentCsv(
  filePath: string,
  submissionId: string,
  values: MockEnrollmentEditableValues,
): Promise<boolean> {
  return withFileWriteLock(filePath, async () => {
    const records = await readMockEnrollmentCsv(filePath);
    const index = records.findIndex((record) => record.submissionId === submissionId);
    if (index === -1) return false;

    records[index] = { ...records[index], ...values };
    await writeAllRecords(filePath, records);
    return true;
  });
}

export async function deleteMockEnrollmentCsv(filePath: string, submissionId: string): Promise<boolean> {
  return withFileWriteLock(filePath, async () => {
    const records = await readMockEnrollmentCsv(filePath);
    const remainingRecords = records.filter((record) => record.submissionId !== submissionId);
    if (remainingRecords.length === records.length) return false;

    await writeAllRecords(filePath, remainingRecords);
    return true;
  });
}
