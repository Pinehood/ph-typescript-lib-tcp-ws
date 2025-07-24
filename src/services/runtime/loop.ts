import { v4 as uuidv4 } from "uuid";

export class Loop {
  private instance: ReturnType<typeof setInterval> | null = null;
  private isRunning: boolean = false;
  private readonly loopId: string;

  constructor(
    private readonly fn: () => void | Promise<void> = () => {},
    private readonly interval = 5000,
    start = false
  ) {
    this.loopId = uuidv4();
    if (start) {
      this.start();
    }
  }

  id() {
    return this.loopId;
  }

  running() {
    return this.isRunning;
  }

  start() {
    this.instance = setInterval(this.fn, this.interval);
    this.isRunning = true;
  }

  stop() {
    if (this.instance) {
      clearInterval(this.instance);
      this.instance = null;
      this.isRunning = false;
    }
  }

  get() {
    return this.instance;
  }
}
