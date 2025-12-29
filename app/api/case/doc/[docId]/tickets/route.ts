import { NextResponse } from "next/server";
import { CASE_API_TIMEOUT_MS } from "@/lib/timeouts";

const BASE_URL = "http://10.1.10.224:8080/api/case/doc";

export async function GET(
  _request: Request,
  context: { params: { docId: string } },
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CASE_API_TIMEOUT_MS);
  const requestId = crypto.randomUUID();
  const requestStartedAt = Date.now();
  const requestStartedAtIso = new Date(requestStartedAt).toISOString();
  const targetUrl = new URL(
    `${BASE_URL}/${encodeURIComponent(context.params.docId)}/tickets`,
  );

  try {
    console.info("Tickets request started.", {
      requestId,
      targetUrl: targetUrl.toString(),
      startedAt: requestStartedAtIso,
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
    const completedAt = new Date().toISOString();
    const durationMs = Date.now() - requestStartedAt;

    console.info("Tickets request completed.", {
      requestId,
      targetUrl: targetUrl.toString(),
      startedAt: requestStartedAtIso,
      completedAt,
      durationMs,
      upstreamStatus: response.status,
    });

    return new NextResponse(body, {
      status: response.status,
      headers: {
        "content-type": response.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      const durationMs = Date.now() - requestStartedAt;
      console.error("Tickets request timed out.", {
        requestId,
        targetUrl: targetUrl.toString(),
        startedAt: requestStartedAtIso,
        completedAt: new Date().toISOString(),
        durationMs,
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
      });
      return NextResponse.json(
        { error: "Request timed out", requestId, upstreamStatus: null },
        { status: 504 },
      );
    }

    const durationMs = Date.now() - requestStartedAt;
    const errorObject = error instanceof Error ? error : new Error("Proxy error");
    const errorCode =
      (errorObject as NodeJS.ErrnoException).code ??
      (errorObject as { cause?: { code?: string } }).cause?.code;
    const isNetworkError =
      errorCode === "ECONNRESET" || errorCode === "ETIMEDOUT";

    if (isNetworkError) {
      console.error("Tickets network error.", {
        requestId,
        targetUrl: targetUrl.toString(),
        startedAt: requestStartedAtIso,
        completedAt: new Date().toISOString(),
        durationMs,
        errorCode,
        errorName: errorObject.name,
        errorMessage: errorObject.message,
        errorStack: errorObject.stack,
      });
    } else {
      console.error("Tickets request failed.", {
        requestId,
        targetUrl: targetUrl.toString(),
        startedAt: requestStartedAtIso,
        completedAt: new Date().toISOString(),
        durationMs,
        errorName: errorObject.name,
        errorMessage: errorObject.message,
        errorStack: errorObject.stack,
      });
    }

    return NextResponse.json(
      {
        error: errorObject.message || "Proxy error",
        requestId,
        upstreamStatus: null,
      },
      { status: 500 },
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
