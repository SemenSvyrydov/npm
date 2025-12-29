import {
  CASE_API_CONCURRENCY_LIMIT,
  CASE_API_QUEUE_TIMEOUT_MS,
} from "@/lib/case-api-limits";
import { Semaphore } from "@/lib/server/semaphore";

export const caseApiSemaphore = new Semaphore(CASE_API_CONCURRENCY_LIMIT);

export const CASE_API_QUEUE_TIMEOUT_SECONDS = Math.ceil(
  CASE_API_QUEUE_TIMEOUT_MS / 1000,
);
