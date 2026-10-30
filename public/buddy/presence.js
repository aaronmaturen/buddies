import { Spring } from "./spring.js";

// Going away and coming back. vanish() squashes down, zips up thin and is gone in a puff; the buddy then
// stays away, however long, until appear() pops it back in on wobbly springs.
const WINDUP = .12, ZIP = .26;
const ease = u => u * u * (3 - 2 * u);

export class Presence {
  constructor() { this.state = "here"; this.start = 0; this.sx = new Spring(1); this.sy = new Spring(1); }

  // True from the moment it starts leaving until appear().
  get away() { return this.state !== "here"; }
  get gone() { return this.state === "gone"; }

  vanish(now) {
    if (this.away) return false;
    this.state = "leaving"; this.start = now;
    return true;
  }

  // Also works mid-exit: the springs pick up from wherever the zip had got to.
  appear() {
    if (!this.away) return false;
    if (this.gone) { this.sx.x = this.sy.x = 0; this.sx.v = 2; this.sy.v = 9; }
    this.state = "here"; this.sx.t = this.sy.t = 1;
    return true;
  }

  // Per frame while leaving: drive the scale by hand. Returns true on the frame it vanishes, for the puff.
  update(now) {
    if (this.state !== "leaving") return false;
    const t = now - this.start;
    const set = (x, y) => { this.sx.x = x; this.sy.x = y; this.sx.v = this.sy.v = 0; };
    if (t < WINDUP) { const u = ease(t / WINDUP); set(1 + .22 * u, 1 - .2 * u); return false; }
    const u = Math.min(1, (t - WINDUP) / ZIP), e = u * u;
    set(1.22 * (1 - e), .8 + .9 * e);
    if (u < 1) return false;
    this.state = "gone";
    return true;
  }

  integrate(dt) {
    if (this.state !== "here") return;
    this.sx.step(dt, 240, .32); this.sy.step(dt, 300, .28);
  }

  // Width and height multipliers about the bottom of the head.
  get scale() { return [Math.max(0, this.sx.x), Math.max(0, this.sy.x)]; }
}
