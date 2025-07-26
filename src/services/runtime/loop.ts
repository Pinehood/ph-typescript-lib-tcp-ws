import { Calculator } from "../data";

export class Loop {
  private instance: ReturnType<typeof setInterval> | null = null;
  private isRunning: boolean = false;
  private readonly loopId: string;

  constructor(
    private readonly fn: () => void | Promise<void> = () => {},
    private readonly interval = 5000,
    start = false
  ) {
    this.loopId = Calculator.calculateNewId();
    if (start) {
      this.start();
    }
  }

  id(): string {
    return this.loopId;
  }

  running(): boolean {
    return this.isRunning;
  }

  start(): void {
    this.instance = setInterval(this.fn, this.interval);
    this.isRunning = true;
  }

  stop(): void {
    if (this.instance) {
      clearInterval(this.instance);
      this.instance = null;
      this.isRunning = false;
    }
  }

  get(): NodeJS.Timeout | null {
    return this.instance;
  }
}
