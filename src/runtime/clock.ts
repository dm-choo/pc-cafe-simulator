/** Fixed 50 ms sim steps; blocked time is never replayed on resume. */
export class FixedClock {
  private previous: number | undefined;
  private accumulator = 0;
  private wasBlocked = true;
  advance(now: number, blocked: boolean, step: () => void): number {
    if (this.previous === undefined || blocked || this.wasBlocked) {
      this.previous = now;
      this.accumulator = 0;
      this.wasBlocked = blocked;
      return 0;
    }
    const delta = Math.max(0, now - this.previous);
    this.previous = now;
    this.accumulator += delta;
    let count = 0;
    while (this.accumulator >= 50 && count < 8) {
      step();
      this.accumulator -= 50;
      count++;
    }
    return this.accumulator;
  }
  reset() {
    this.previous = undefined;
    this.accumulator = 0;
    this.wasBlocked = true;
  }
}
