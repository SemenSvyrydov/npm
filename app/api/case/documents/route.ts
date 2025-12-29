import { NextResponse } from "next/server";
import {
  CASE_API_CONCURRENCY_LIMIT,
  CASE_API_QUEUE_TIMEOUT_MS,
} from "@/lib/case-api-limits";
import { CASE_API_TIMEOUT_MS } from "@/lib/timeouts";
import {
  CASE_API_QUEUE_TIMEOUT_SECONDS,
  caseApiSemaphore,
} from "@/lib/server/case-api-semaphore";

const DOCUMENTS_URL = "http://10.1.10.224:8080/api/case/documents";
const RETRY_DELAYS_MS = [200, 500, 1000];
const RETRY_STATUS_CODES = new Set([502, 503, 504]);

const delay = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  const requestStartedAt = Date.now();
  const requestStartedAtIso = new Date(requestStartedAt).toISOString();
  let targetUrlString = DOCUMENTS_URL;
  let lastError: Error | null = null;
  let lastUpstreamStatus: number | null = null;
  const queueStartedAt = Date.now();
  const acquired = await caseApiSemaphore.acquire(CASE_API_QUEUE_TIMEOUT_MS);

  if (!acquired) {
    const queueDurationMs = Date.now() - queueStartedAt;
    console.warn("Documents request rejected due to concurrency limit.", {
      requestId,
      targetUrl: targetUrlString,
      startedAt: requestStartedAtIso,
      queueDurationMs,
      limit: CASE_API_CONCURRENCY_LIMIT,
      queued: caseApiSemaphore.queued,
      inFlight: caseApiSemaphore.inFlight,
    });

    return NextResponse.json(
      {
        error: "Server is busy. Reduce parallelism and try again.",
        requestId,
        limit: CASE_API_CONCURRENCY_LIMIT,
      },
      {
        status: 429,
        headers: {
          "retry-after": CASE_API_QUEUE_TIMEOUT_SECONDS.toString(),
        },
      },
    );
  }

  const queueDurationMs = Date.now() - queueStartedAt;

  try {
    const requestUrl = new URL(request.url);
    const targetUrl = new URL(DOCUMENTS_URL);

    requestUrl.searchParams.forEach((value, key) => {
      targetUrl.searchParams.append(key, value);
    });
    targetUrlString = targetUrl.toString();

    console.info("Documents request started.", {
      requestId,
      targetUrl: targetUrlString,
      startedAt: requestStartedAtIso,
      queueDurationMs,
    });

    for (let attempt = 0; attempt < RETRY_DELAYS_MS.length; attempt += 1) {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        CASE_API_TIMEOUT_MS,
      );

      try {
        const response = await fetch(targetUrlString, {
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
          console.warn("Documents request retrying after upstream error.", {
            requestId,
            targetUrl: targetUrlString,
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

        console.info("Documents request completed.", {
          requestId,
          targetUrl: targetUrlString,
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
          console.warn("Documents request retrying after network error.", {
            requestId,
            targetUrl: targetUrlString,
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
          console.error("Documents network error.", {
            requestId,
            targetUrl: targetUrlString,
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

        console.error("Documents request failed.", {
          requestId,
          targetUrl: targetUrlString,
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

    console.error("Documents request failed after retries.", {
      requestId,
      targetUrl: targetUrlString,
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
  } finally {
    caseApiSemaphore.release();
  }
}
