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
import { withUpstreamLimit } from "@/lib/upstreamLimiter";

const BASE_URL = "http://10.1.10.224:8080/api/case/doc";
const RETRY_DELAYS_MS = [200, 500, 1000];
const RETRY_STATUS_CODES = new Set([502, 503, 504]);

const delay = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const fetchWithRetry = async ({
  requestId,
  targetUrl,
  startedAt,
}: {
  requestId: string;
  targetUrl: string;
  startedAt: string;
}) => {
  let lastError: Error | null = null;
  let lastUpstreamStatus: number | null = null;

  for (let attempt = 0; attempt < RETRY_DELAYS_MS.length; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CASE_API_TIMEOUT_MS);

    try {
      const response = await withUpstreamLimit(() =>
        fetch(targetUrl, {
          method: "GET",
          headers: {
            accept: "application/json",
          },
          cache: "no-store",
          signal: controller.signal,
        }),
      );

      if (RETRY_STATUS_CODES.has(response.status)) {
        lastUpstreamStatus = response.status;
        if (attempt < RETRY_DELAYS_MS.length - 1) {
          console.warn("Tickets request retrying after upstream error.", {
            requestId,
            targetUrl,
            startedAt,
            upstreamStatus: response.status,
            attempt: attempt + 1,
          });
          await delay(RETRY_DELAYS_MS[attempt]);
          continue;
        }
        return { response: null, lastError, lastUpstreamStatus };
      }

      return { response, lastError: null, lastUpstreamStatus: null };
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

      if (isNetworkError) {
        lastError = errorObject;
        if (attempt < RETRY_DELAYS_MS.length - 1) {
          console.warn("Tickets request retrying after network error.", {
            requestId,
            targetUrl,
            startedAt,
            errorCode,
            errorName: errorObject.name,
            errorMessage: errorObject.message,
            attempt: attempt + 1,
          });
          await delay(RETRY_DELAYS_MS[attempt]);
          continue;
        }

        return { response: null, lastError, lastUpstreamStatus };
      }

      return {
        response: null,
        lastError: errorObject,
        lastUpstreamStatus: null,
        nonRetryableError: errorObject,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  return { response: null, lastError, lastUpstreamStatus };
};

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
  const queueStartedAt = Date.now();
  const acquired = await caseApiSemaphore.acquire(CASE_API_QUEUE_TIMEOUT_MS);

  if (!acquired) {
    const queueDurationMs = Date.now() - queueStartedAt;
    console.warn("Tickets request rejected due to concurrency limit.", {
      requestId,
      targetUrl: targetUrl.toString(),
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
    console.info("Tickets request started.", {
      requestId,
      targetUrl: targetUrl.toString(),
      startedAt: requestStartedAtIso,
      queueDurationMs,
    });

    const { response, lastError, lastUpstreamStatus, nonRetryableError } =
      await fetchWithRetry({
        requestId,
        targetUrl: targetUrl.toString(),
        startedAt: requestStartedAtIso,
      });

    if (nonRetryableError) {
      console.error("Tickets request failed.", {
        requestId,
        targetUrl: targetUrl.toString(),
        startedAt: requestStartedAtIso,
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - requestStartedAt,
        errorName: nonRetryableError.name,
        errorMessage: nonRetryableError.message,
        errorStack: nonRetryableError.stack,
      });

      return NextResponse.json(
        {
          error: nonRetryableError.message || "Proxy error",
          requestId,
          upstreamStatus: null,
        },
        { status: 500 },
      );
    }

    if (response) {
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
        error: "Upstream connection failed after retries",
        requestId,
        upstreamStatus: lastUpstreamStatus,
      },
      { status: 502 },
    );
  } finally {
    caseApiSemaphore.release();
  }
}
