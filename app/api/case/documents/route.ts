import { NextResponse } from "next/server";
import { CASE_API_TIMEOUT_MS } from "@/lib/timeouts";

const DOCUMENTS_URL = "http://10.1.10.224:8080/api/case/documents";

export async function GET(request: Request) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CASE_API_TIMEOUT_MS);

  try {
    const requestUrl = new URL(request.url);
    const targetUrl = new URL(DOCUMENTS_URL);

    requestUrl.searchParams.forEach((value, key) => {
      targetUrl.searchParams.append(key, value);
    });

    const response = await fetch(targetUrl.toString(), {
      method: "GET",
      headers: {
        accept: "application/json",
      },
      cache: "no-store",
      signal: controller.signal,
    });

    const body = response.body ?? (await response.text());

    return new NextResponse(body, {
      status: response.status,
      headers: {
        "content-type": response.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("Documents request timed out.");
      return NextResponse.json(
        { error: "Request timed out" },
        { status: 504 },
      );
    }

    const message = error instanceof Error ? error.message : "Proxy error";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    clearTimeout(timeoutId);
  }
}
