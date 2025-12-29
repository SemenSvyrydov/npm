const DEFAULT_CONCURRENCY_LIMIT = 4;
const DEFAULT_QUEUE_TIMEOUT_MS = 5000;

const resolvePositiveInt = (value: string | undefined) => {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed;
};

export const CASE_API_CONCURRENCY_LIMIT =
  resolvePositiveInt(process.env.CASE_API_CONCURRENCY_LIMIT) ??
  resolvePositiveInt(process.env.NEXT_PUBLIC_CASE_API_CONCURRENCY_LIMIT) ??
  DEFAULT_CONCURRENCY_LIMIT;

export const CASE_API_QUEUE_TIMEOUT_MS =
  resolvePositiveInt(process.env.CASE_API_QUEUE_TIMEOUT_MS) ??
  DEFAULT_QUEUE_TIMEOUT_MS;
