export function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export function getRequestOrigin(request: Request): string | null {
  const url = new URL(request.url);
  const host = request.headers.get("host");
  if (!host) return url.origin;
  // NextURL normalizes loopback addresses to localhost. Use the actual HTTP Host so
  // a same-origin browser at 127.0.0.1 is accepted and callback cookies keep their host.
  if (!/^[a-z0-9.:[\]-]+$/iu.test(host)) return null;
  try {
    return new URL(`${url.protocol}//${host}`).origin;
  } catch {
    return null;
  }
}

export function checkSameOriginRequest(request: Request, requiresJson: boolean): Response | null {
  const origin = getRequestOrigin(request);
  if (!origin || request.headers.get("origin") !== origin) {
    return jsonResponse({ message: "요청 출처를 확인할 수 없습니다." }, 403);
  }
  const mediaType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
  if (requiresJson && mediaType !== "application/json") {
    return jsonResponse({ message: "JSON 형식으로 제출해 주세요." }, 415);
  }
  return null;
}

export async function readJsonRequestBody(request: Request, maxBytes: number): Promise<
  | { body: unknown; response?: never }
  | { body?: never; response: Response }
> {
  const tooLarge = () => jsonResponse({ message: "제출 내용이 너무 큽니다." }, 413);
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) return { response: tooLarge() };

  const reader = request.body?.getReader();
  if (!reader) return { response: jsonResponse({ message: "제출 내용을 읽을 수 없습니다." }, 400) };

  const decoder = new TextDecoder("utf-8", { fatal: true });
  let bytesRead = 0;
  let text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytesRead += value.byteLength;
      if (bytesRead > maxBytes) {
        await reader.cancel();
        return { response: tooLarge() };
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    return { body: JSON.parse(text) as unknown };
  } catch {
    return { response: jsonResponse({ message: "제출 내용을 읽을 수 없습니다." }, 400) };
  } finally {
    reader.releaseLock();
  }
}
