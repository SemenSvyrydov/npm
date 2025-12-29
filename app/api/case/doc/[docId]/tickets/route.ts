import { NextResponse } from "next/server";
import { CASE_API_TIMEOUT_MS } from "@/lib/timeouts";

const BASE_URL = "http://10.1.10.224:8080/api/case/doc";
const RETRY_DELAYS_MS = [200, 500, 1000];
const RETRY_STATUS_CODES = new Set([502, 503, 504]);

const delay = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export async function GET(
  _request: Request,
  context: { params: { docId: string } },
) {
  const requestId = crypto.randomUUID();
  const requestStartedAt = Date.now();
  const requestStartedAtIso = new Date(requestStartedAt).toISOString();
  const targetUrl = new URL(
    `${BASE_URL}/${encodeURIComponent(context.params.docId)}/tickets`,
  );
  let lastError: Error | null = null;
  let lastUpstreamStatus: number | null = null;

  try {
    console.info("Tickets request started.", {
      requestId,
      targetUrl: targetUrl.toString(),
      startedAt: requestStartedAtIso,
    });

    for (let attempt = 0; attempt < RETRY_DELAYS_MS.length; attempt += 1) {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        CASE_API_TIMEOUT_MS,
      );

      try {
        const response = await fetch(targetUrl.toString(), {
          method: "GET",
          headers: {
            accept: "application/json",
          },
          cache: "no-store",
          signal: controller.signal,
        });

        if (
          RETRY_STATUS_CODES.has(response.status) &&
          attempt < RETRY_DELAYS_MS.length - 1
        ) {
          lastUpstreamStatus = response.status;
          console.warn("Tickets request retrying after upstream error.", {
            requestId,
            targetUrl: targetUrl.toString(),
            startedAt: requestStartedAtIso,
            upstreamStatus: response.status,
            attempt: attempt + 1,
          });
          await delay(RETRY_DELAYS_MS[attempt]);
          continue;
        }

        if (RETRY_STATUS_CODES.has(response.status)) {
          lastUpstreamStatus = response.status;
          break;
        }

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
            "content-type":
              response.headers.get("content-type") ?? "application/json",
          },
        });
      } catch (error) {
        const errorObject =
          error instanceof Error ? error : new Error("Proxy error");
        const errorCode =
          (errorObject as NodeJS.ErrnoException).code ??
          (errorObject as { cause?: { code?: string } }).cause?.code;
        const isNetworkError =
          errorObject.name === "AbortError" ||
          errorCode === "ECONNRESET" ||
          errorCode === "ETIMEDOUT";

        if (isNetworkError && attempt < RETRY_DELAYS_MS.length - 1) {
          console.warn("Tickets request retrying after network error.", {
            requestId,
            targetUrl: targetUrl.toString(),
            startedAt: requestStartedAtIso,
            errorCode,
            errorName: errorObject.name,
            errorMessage: errorObject.message,
            attempt: attempt + 1,
          });
          await delay(RETRY_DELAYS_MS[attempt]);
          continue;
        }

        lastError = errorObject;
        if (isNetworkError) {
          console.error("Tickets network error.", {
            requestId,
            targetUrl: targetUrl.toString(),
            startedAt: requestStartedAtIso,
            completedAt: new Date().toISOString(),
            durationMs: Date.now() - requestStartedAt,
            errorCode,
            errorName: errorObject.name,
            errorMessage: errorObject.message,
            errorStack: errorObject.stack,
          });
          break;
        }

        console.error("Tickets request failed.", {
          requestId,
          targetUrl: targetUrl.toString(),
          startedAt: requestStartedAtIso,
          completedAt: new Date().toISOString(),
          durationMs: Date.now() - requestStartedAt,
          errorName: errorObject.name,
          errorMessage: errorObject.message,
          errorStack: errorObject.stack,
        });

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

    console.error("Tickets request failed after retries.", {
      requestId,
      targetUrl: targetUrl.toString(),
      startedAt: requestStartedAtIso,
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - requestStartedAt,
      upstreamStatus: lastUpstreamStatus,
      errorName: lastError?.name,
      errorMessage: lastError?.message,
    });

    return NextResponse.json(
      {
        error: "Upstream unavailable after retries",
        requestId,
        upstreamStatus: lastUpstreamStatus,
      },
      { status: 502 },
    );
  }
}
