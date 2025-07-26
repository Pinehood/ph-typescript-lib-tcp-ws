import { Loop } from "./loop";

export class Manager {
  private updateLoops: Array<Loop>;

  constructor() {
    this.updateLoops = [];
  }

  addUpdateLoop(loop: Loop): void {
    this.updateLoops.push(loop);
  }

  removeUpdateLoop(loop: Loop | string): void {
    if (typeof loop === "string") {
      this.updateLoops = this.updateLoops.filter((l) => l.id() !== loop);
    } else {
      this.updateLoops = this.updateLoops.filter((l) => l != loop);
    }
  }

  startUpdateLoops(): void {
    this.updateLoops.forEach((loop) => {
      if (!loop.running()) {
        loop.start();
      }
    });
  }

  stopUpdateLoops(): void {
    this.updateLoops.forEach((loop) => {
      if (loop.running()) {
        loop.stop();
      }
    });
  }
}
