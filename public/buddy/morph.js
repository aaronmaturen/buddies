import { clamp, reducedMotion } from "./util.js";
import { Spring } from "./spring.js";
import { INK, outlinePoints } from "./heads.js";

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
  let p = signedArea(pts) < 0 ? [...pts].reverse() : [...pts];
  let best = 0;
  p.forEach((q, i) => { if (Math.abs(Math.atan2(q[1], q[0])) < Math.abs(Math.atan2(p[best][1], p[best][0]))) best = i; });
  return [...p.slice(best), ...p.slice(0, best)];
}

// Resample a polygon to n points evenly spaced along its edges.
function ring(poly, n) {
  const p = align(poly);
  const lens = p.map((a, i) => Math.hypot(p[(i + 1) % p.length][0] - a[0], p[(i + 1) % p.length][1] - a[1]));
  const total = lens.reduce((a, b) => a + b, 0);
  return Array.from({ length: n }, (_, k) => {
    let d = k / n * total, i = 0;
    while (d > lens[i]) d -= lens[i++];
    const a = p[i], b = p[(i + 1) % p.length], u = d / lens[i];
    return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
  });
}

// Uniform Catmull-Rom through waypoints; u runs 0..1 over the whole path.
function catmull(w, u) {
  const segs = w.length - 1, f = clamp(u, 0, 1) * segs, i = Math.min(segs - 1, Math.floor(f)), t = f - i;
  const P = k => w[clamp(k, 0, segs)];
  const [a, b, c, d] = [P(i - 1), P(i), P(i + 1), P(i + 2)];
  const at = j => .5 * ((2 * b[j]) + (-a[j] + c[j]) * t + (2 * a[j] - 5 * b[j] + 4 * c[j] - d[j]) * t * t + (-a[j] + 3 * b[j] - 3 * c[j] + d[j]) * t * t * t);
  return { x: at(0), y: at(1), seg: i };
}

const smooth = u => u * u * (3 - 2 * u);

// Each morph: outline (polygon, head units, nose/front toward +x), size while transformed, where the eyes ride,
// how long it acts, a flight path in head units around its resting spot (y down), the path segments where it may
// fly upside down (a loop), and details drawn over the shape.
export const MORPHS = {
  airplane: {
    label: "Paper airplane",
    outline: [[1.15, .02], [-.25, .2], [-.55, .42], [-.95, .12], [-.6, -.08], [-.9, -.6]],
    scale: .85,
    eyes: { x: .36, y: -.07, gap: .3, size: .9 },
    duration: 4.6,
    path: [[0, 0], [.8, -.35], [1.6, .15], [2.2, -.45], [1.6, -1.05], [1, -.45], [1.6, .15], [2.15, .05],
           [1.95, -.6], [0, -.95], [-1.8, -.7], [-2.05, .05], [-1, .28], [0, 0]],
    loop: [2, 6],
    detail(ctx, { speed }) {
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      // Top wing catches more light, and the creases show the folds.
      ctx.beginPath(); ctx.moveTo(1.15, .02); ctx.lineTo(-.9, -.6); ctx.lineTo(-.6, -.08); ctx.closePath();
      ctx.fillStyle = "rgba(255, 255, 255, .22)"; ctx.fill();
      ctx.beginPath(); ctx.moveTo(1.1, .02); ctx.lineTo(-.6, -.08); ctx.moveTo(1.05, .05); ctx.lineTo(-.25, .2);
      ctx.lineWidth = .035; ctx.strokeStyle = "rgba(22, 24, 30, .55)"; ctx.stroke();
      // Speed lines trail off the tail when it's moving fast.
      if (speed > .4) {
        ctx.globalAlpha *= clamp((speed - .4) / 1.2, 0, .8);
        ctx.lineWidth = .05; ctx.strokeStyle = "rgba(255, 255, 255, .9)";
        ctx.beginPath();
        for (const [y, len] of [[-.35, .7], [.05, 1], [.3, .55]]) { ctx.moveTo(-1.05, y); ctx.lineTo(-1.05 - len, y); }
        ctx.stroke();
        ctx.lineWidth = .02; ctx.strokeStyle = INK; ctx.globalAlpha *= .3; ctx.stroke();
      }
    },
  },
};
export const MORPH_NAMES = Object.keys(MORPHS);
for (const def of Object.values(MORPHS)) def.ring = ring(def.outline, N);

// Runs one morph at a time for one buddy.
export class MorphPlayer {
  constructor() { this.active = null; this.k = new Spring(0); this.last = null; }

  get busy() { return !!this.active; }

  start(name, now) {
    const def = MORPHS[name];
    if (!def || this.active) return false;
    this.active = { def, start: now, puffedOut: false, puffedIn: false };
    this.k.t = 1;
    return true;
  }

  integrate(dt) { this.k.step(dt, 110, .5); }

  // Per frame. Returns null when not morphing, else the ring to draw, how far into the object it is (k),
  // the flight offset { x, y, rot, flip, scale, speed }, and which puffs of smoke to spawn this frame.
  update(now, head) {
    const a = this.active;
    if (!a) return null;
    const { def } = a, t = now - a.start, end = IN + def.duration;
    const puff = [];
    if (!a.puffedIn) { a.puffedIn = true; puff.push("in"); }
    if (t >= end) {
      this.k.t = 0;
      if (!a.puffedOut) { a.puffedOut = true; puff.push("out"); }
      if (t > end + OUT && Math.abs(this.k.x) < .02) { this.active = null; this.k.x = 0; this.k.v = 0; return null; }
    }
    const k = this.k.x;
    const from = align(outlinePoints(head, N, now).map(p => [p[0], p[1]]));
    const points = from.map((p, i) => [p[0] + (def.ring[i][0] - p[0]) * k, p[1] + (def.ring[i][1] - p[1]) * k]);

    const u = reducedMotion ? 0 : smooth(clamp((t - IN * .7) / def.duration, 0, 1));
    const pos = catmull(def.path, u), ahead = catmull(def.path, u + .004);
    const vx = ahead.x - pos.x, vy = ahead.y - pos.y;
    const speed = Math.hypot(vx, vy) / .004 / def.duration;
    let rot = Math.hypot(vx, vy) > 1e-6 ? Math.atan2(vy, vx) : 0, flip = false;
    const looping = pos.seg >= def.loop[0] && pos.seg < def.loop[1];
    if (!looping && vx < 0) { flip = true; rot = Math.atan2(vy, -vx); }
    // Settle level at rest so the morph back starts from an upright pose.
    const level = clamp(Math.min(u * 8, (1 - u) * 8), 0, 1);
    this.last = { k, points, def, puff, flight: { x: pos.x, y: pos.y, rot: rot * level, flip, scale: 1 - (1 - def.scale) * clamp(k, 0, 1), speed } };
    return this.last;
  }
}
