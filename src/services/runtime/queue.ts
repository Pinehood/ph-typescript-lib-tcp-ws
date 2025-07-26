import { Task } from "../../common";

export class Queue {
  private concurrency: number;
  private queue: Array<Task<any>>;
  private activeCount: number;

  constructor(concurrency: number = 1) {
    this.concurrency = concurrency;
    this.queue = [];
    this.activeCount = 0;
  }

  add<T>(
    fn: () => T | Promise<T>,
    options?: { priority?: number; timeout?: number }
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        fn,
        resolve,
        reject,
        priority: options?.priority ?? 0,
        timeout: options?.timeout,
      });
      this.sortQueue();
      this.next();
    });
  }

  private sortQueue(): void {
    this.queue.sort((a, b) => b.priority - a.priority);
  }

  private async next(): Promise<void> {
    if (this.activeCount >= this.concurrency || this.queue.length === 0) return;

    const task = this.queue.shift();
    if (!task) return;

    const { fn, resolve, reject, timeout } = task;
    this.activeCount++;

    const runWithTimeout = async () => {
      if (timeout != null) {
        return Promise.race([
          fn(),
          new Promise<never>((_, rej) => setTimeout(() => rej(), timeout)),
        ]);
      } else {
        return fn();
      }
    };

    try {
      const result = await runWithTimeout();
      resolve(result);
    } catch (err) {
      reject(err);
    } finally {
      this.activeCount--;
      this.next();
    }
  }
}
