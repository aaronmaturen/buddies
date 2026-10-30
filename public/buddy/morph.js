import { clamp, reducedMotion } from "./util.js";
import { Spring } from "./spring.js";
import { outlinePoints } from "./heads.js";
import { MORPHS } from "./morphs/index.js";
import { catmull, smooth } from "./morphs/shared.js";

export { MORPHS };
export const MORPH_NAMES = Object.keys(MORPHS);

// Morphs: the head melts into an object, the object does its thing, then melts back.
// Both outlines are rings of N points in head units, started at the rightmost point and running the same way
// round, so point i on the head slides to point i on the object without the shape twisting.
const N = 96;
const IN = .5, OUT = .6;

function signedArea(pts) {
  return pts.reduce((a, p, i) => { const q = pts[(i + 1) % pts.length]; return a + p[0] * q[1] - q[0] * p[1]; }, 0);
}

// Same winding as head outlines (positive with y down), starting at the point nearest straight right.
function align(pts) {
  const p = signedArea(pts) < 0 ? [...pts].reverse() : [...pts];
  let best = 0;
  p.forEach((q, i) => { if (Math.abs(Math.atan2(q[1], q[0])) < Math.abs(Math.atan2(p[best][1], p[best][0]))) best = i; });
  return [...p.slice(best), ...p.slice(0, best)];
}

// Resample a polygon to n points evenly spaced along its edges (repeated points are dropped first).
function ring(poly, n) {
  const p = align(poly.filter((q, i) => { const r = poly[(i + 1) % poly.length]; return Math.hypot(r[0] - q[0], r[1] - q[1]) > 1e-6; }));
  const lens = p.map((a, i) => Math.hypot(p[(i + 1) % p.length][0] - a[0], p[(i + 1) % p.length][1] - a[1]));
  const total = lens.reduce((a, b) => a + b, 0);
  return Array.from({ length: n }, (_, k) => {
    let d = k / n * total, i = 0;
    while (d > lens[i]) d -= lens[i++];
    const a = p[i], b = p[(i + 1) % p.length], u = d / lens[i];
    return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
  });
}

for (const def of Object.values(MORPHS)) if (typeof def.outline !== "function") def.ring = ring(def.outline, N);

// Follow def.path nose-first; flip to face the direction of travel except inside def.loop.
function followPath(def, u) {
  const s = smooth(u), pos = catmull(def.path, s), ahead = catmull(def.path, s + .004);
  const vx = ahead.x - pos.x, vy = ahead.y - pos.y;
  let rot = Math.hypot(vx, vy) > 1e-6 ? Math.atan2(vy, vx) : 0, flip = false;
  const [a, b] = def.loop || [0, 0];
  if (!(pos.seg >= a && pos.seg < b) && vx < 0) { flip = true; rot = Math.atan2(vy, -vx); }
  // Level off at both ends so the melt starts and finishes upright.
  const level = clamp(Math.min(s * 8, (1 - s) * 8), 0, 1);
  return { x: pos.x, y: pos.y, rot: rot * level, flip };
}

// Runs one morph at a time for one buddy.
export class MorphPlayer {
  constructor() { this.active = null; this.k = new Spring(0); }

  get busy() { return !!this.active; }

  start(name, now) {
    const def = MORPHS[name];
    if (!def || this.active) return false;
    this.active = { def, start: now, puffedIn: false, puffedOut: false, fired: 0, last: null };
    this.k.t = 1;
    return true;
  }

  // Drop the current morph at once (used when the buddy vanishes).
  stop() { this.active = null; this.k.x = this.k.t = this.k.v = 0; }

  integrate(dt) { this.k.step(dt, 110, .5); }

  // Per frame. Returns null when not morphing, else { k, points, def, puff, spawn, flight }:
  // how far into the object it is, the ring to draw, which puffs and event symbols to spawn this frame, and the
  // flight { x, y, rot, flip, sx, sy, scale, speed, ...extras } in head units around the resting spot.
  update(now, head) {
    const a = this.active;
    if (!a) return null;
    const { def } = a, t = now - a.start, end = IN + def.duration;
    const puff = [], spawn = [];
    if (!a.puffedIn) { a.puffedIn = true; puff.push("in"); }
    if (t >= end) {
      this.k.t = 0;
      if (!a.puffedOut) { a.puffedOut = true; puff.push("out"); }
      if (t > end + OUT && Math.abs(this.k.x) < .02) { this.active = null; this.k.x = 0; this.k.v = 0; return null; }
    }
    const k = this.k.x;
    const target = def.ring || ring(def.outline(now), N);
    const from = align(outlinePoints(head, N, now).map(p => [p[0], p[1]]));
    const points = from.map((p, i) => [p[0] + (target[i][0] - p[0]) * k, p[1] + (target[i][1] - p[1]) * k]);

    const u = reducedMotion ? 0 : clamp((t - IN * .7) / def.duration, 0, 1);
    const move = def.motion ? def.motion(u, now) : followPath(def, u);
    const events = def.events || [];
    while (a.fired < events.length && events[a.fired].at <= u) spawn.push(events[a.fired++]);

    const speed = a.last ? Math.hypot(move.x - a.last.x, move.y - a.last.y) / Math.max(1e-3, now - a.last.now) : 0;
    a.last = { x: move.x, y: move.y, now };
    const flight = { sx: 1, sy: 1, flip: false, speed, ...move, scale: 1 - (1 - def.scale) * clamp(k, 0, 1) };
    return { k, points, def, puff, spawn, flight };
  }
}
