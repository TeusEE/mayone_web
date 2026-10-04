import assert from "node:assert/strict";
import { checkSameOriginRequest, jsonResponse, readJsonRequestBody } from "../src/lib/http";
import { checkLocalStorageRequest } from "../src/lib/local-storage-access";

const origin = "http://localhost:3000";
function request(body: BodyInit, headers: Record<string, string> = {}): Request {
  return new Request(`${origin}/api/example`, {
    method: "POST", body, headers: { origin, "content-type": "application/json", ...headers },
  });
}

async function main() {
  assert.equal(checkSameOriginRequest(request("{}"), true), null);
  assert.equal(checkSameOriginRequest(request("{}", { origin: "https://other.example" }), true)?.status, 403);
  assert.equal(checkSameOriginRequest(request("{}", { origin: "" }), true)?.status, 403);
  assert.equal(checkSameOriginRequest(request("{}", { "content-type": "application/json-invalid" }), true)?.status, 415);
  assert.equal(checkSameOriginRequest(request("{}", { "content-type": "application/json; charset=utf-8" }), true), null);
  assert.equal(checkSameOriginRequest(request("{}", { "content-type": "text/plain" }), false), null);
  assert.equal(jsonResponse({}, 200).headers.get("cache-control"), "no-store");

  const body = JSON.stringify({ name: "테스트" });
  const byteLength = new TextEncoder().encode(body).length;
  assert.deepEqual((await readJsonRequestBody(request(body), byteLength)).body, { name: "테스트" });
  assert.equal((await readJsonRequestBody(request(body), byteLength - 1)).response?.status, 413);
  assert.equal((await readJsonRequestBody(request("{}", { "content-length": "100" }), 10)).response?.status, 413);
  assert.equal((await readJsonRequestBody(request("invalid JSON"), 100)).response?.status, 400);
  assert.equal((await readJsonRequestBody(request(new Uint8Array([0xff])), 100)).response?.status, 400);

  // Enforce limits during streaming even when Content-Length is absent or false.
  let cancelled = false;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) { controller.enqueue(new Uint8Array(20)); },
    cancel() { cancelled = true; },
  });
  const streamingRequest = new Request(`${origin}/api/example`, {
    method: "POST", body: stream, duplex: "half", headers: { "content-length": "1" },
  } as RequestInit & { duplex: "half" });
  assert.equal((await readJsonRequestBody(streamingRequest, 10)).response?.status, 413);
  assert.equal(cancelled, true);

  const env = process.env as Record<string, string | undefined>;
  env.NODE_ENV = "development";
  assert.equal(checkLocalStorageRequest(request("{}", { host: "localhost:3000" })), null);
  assert.equal(checkLocalStorageRequest(request("{}", { host: "admin.example.com" }))?.status, 404);
  env.NODE_ENV = "production";
  assert.equal(checkLocalStorageRequest(request("{}", { host: "localhost:3000" }))?.status, 404);
  console.log("HTTP 검증 통과: Origin·JSON 형식·스트림 크기 제한·UTF-8·로컬 저장 제한");
}

main().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
