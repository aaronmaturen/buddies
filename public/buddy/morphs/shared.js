import { clamp, TAU } from "../util.js";

export const smooth = u => u * u * (3 - 2 * u);
export const ease = (u, a, b) => smooth(clamp((u - a) / (b - a), 0, 1));

// Uniform Catmull-Rom through waypoints; u runs 0..1 over the whole path. seg is the segment it's in.
export function catmull(w, u) {
  const segs = w.length - 1, f = clamp(u, 0, 1) * segs, i = Math.min(segs - 1, Math.floor(f)), t = f - i;
  const P = k => w[clamp(k, 0, segs)];
  const [a, b, c, d] = [P(i - 1), P(i), P(i + 1), P(i + 2)];
  const at = j => .5 * ((2 * b[j]) + (-a[j] + c[j]) * t + (2 * a[j] - 5 * b[j] + 4 * c[j] - d[j]) * t * t + (-a[j] + 3 * b[j] - 3 * c[j] + d[j]) * t * t * t);
  return { x: at(0), y: at(1), seg: i };
}

// n points around an ellipse, as an outline polygon.
export const ellipse = (rx, ry, n = 40, cx = 0, cy = 0) =>
  Array.from({ length: n }, (_, i) => [cx + Math.cos(i / n * TAU) * rx, cy + Math.sin(i / n * TAU) * ry]);
