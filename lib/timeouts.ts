const DEFAULT_TIMEOUT_MS = 40000;

const resolveTimeout = (value: string | undefined) => {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed;
};

export const CASE_API_TIMEOUT_MS =
  resolveTimeout(process.env.CASE_API_TIMEOUT_MS) ??
  resolveTimeout(process.env.NEXT_PUBLIC_CASE_API_TIMEOUT_MS) ??
  DEFAULT_TIMEOUT_MS;

export const CASE_API_TIMEOUT_SECONDS = Math.round(CASE_API_TIMEOUT_MS / 1000);
