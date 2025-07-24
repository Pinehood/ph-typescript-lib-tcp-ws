import { Loop } from "./loop";

export class Manager {
  private updateLoops: Array<Loop>;

  constructor() {
    this.updateLoops = [];
  }

  addUpdateLoop(loop: Loop) {
    this.updateLoops.push(loop);
  }

  removeUpdateLoop(loop: Loop | string) {
    if (typeof loop === "string") {
      this.updateLoops = this.updateLoops.filter((l) => l.id() !== loop);
    } else {
      this.updateLoops = this.updateLoops.filter((l) => l != loop);
    }
  }

  startUpdateLoops() {
    this.updateLoops.forEach((loop) => {
      if (!loop.running()) {
        loop.start();
      }
    });
  }

  stopUpdateLoops() {
    this.updateLoops.forEach((loop) => {
      if (loop.running()) {
        loop.stop();
      }
    });
  }
}
