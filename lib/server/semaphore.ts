type Waiter = {
  resolve: (acquired: boolean) => void;
  timeoutId: NodeJS.Timeout;
};

export class Semaphore {
  private readonly limit: number;
  private active = 0;
  private readonly queue: Waiter[] = [];

  constructor(limit: number) {
    this.limit = Math.max(1, Math.trunc(limit));
  }

  get queued(): number {
    return this.queue.length;
  }

  get inFlight(): number {
    return this.active;
  }

  async acquire(timeoutMs: number): Promise<boolean> {
    if (this.active < this.limit) {
      this.active += 1;
      return true;
    }

    return new Promise((resolve) => {
      const waiter: Waiter = {
        resolve: (acquired) => {
          clearTimeout(waiter.timeoutId);
          resolve(acquired);
        },
        timeoutId: setTimeout(() => {
          const index = this.queue.indexOf(waiter);
          if (index >= 0) {
            this.queue.splice(index, 1);
          }
          resolve(false);
        }, timeoutMs),
      };

      this.queue.push(waiter);
    });
  }

  release(): void {
    if (this.active > 0) {
      this.active -= 1;
    }

    if (this.queue.length > 0 && this.active < this.limit) {
      const waiter = this.queue.shift();
      if (waiter) {
        this.active += 1;
        waiter.resolve(true);
      }
    }
  }
}
