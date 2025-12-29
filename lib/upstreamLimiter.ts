const DEFAULT_UPSTREAM_CONCURRENCY_LIMIT = 4;

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

export const UPSTREAM_CONCURRENCY_LIMIT =
  resolvePositiveInt(process.env.UPSTREAM_CONCURRENCY_LIMIT) ??
  DEFAULT_UPSTREAM_CONCURRENCY_LIMIT;

type QueueEntry = {
  resolve: () => void;
};

const limit = Math.max(1, Math.trunc(UPSTREAM_CONCURRENCY_LIMIT));
let active = 0;
const queue: QueueEntry[] = [];

const acquire = () => {
  if (active < limit) {
    active += 1;
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    queue.push({ resolve });
  });
};

const release = () => {
  if (active > 0) {
    active -= 1;
  }

  if (queue.length > 0 && active < limit) {
    const entry = queue.shift();
    if (entry) {
      active += 1;
      entry.resolve();
    }
  }
};

export const withUpstreamLimit = async <T>(
  action: () => Promise<T>,
): Promise<T> => {
  await acquire();

  try {
    return await action();
  } finally {
    release();
  }
};
