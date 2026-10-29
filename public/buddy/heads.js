import { TAU, reducedMotion } from "./util.js";

export const INK = "#16181e";

// Head silhouettes. Curved ones are superellipses: sx/sy stretch, n squareness, taper widens the bottom
// (negative widens the top, like the obovoid, an upside-down egg), wobble makes a blob, bumps/lobes make a cloud. Angular ones are rounded polygons:
// verts are [x, y, cornerRadius]. sx/sy also shape the invisible surface the features sit on; faceY moves the
// face down, fit shrinks big shapes, bottom/shadow size the floor shadow, glow places the highlight.
const regular = (k, rad, rot, r) => Array.from({ length: k }, (_, i) => {
  const a = rot + i / k * TAU;
  return [Math.cos(a) * rad, Math.sin(a) * rad, r];
});
const domeVerts = [
  ...Array.from({ length: 13 }, (_, i) => { const a = Math.PI + i / 12 * Math.PI; return [Math.cos(a) * 1.05, Math.sin(a) + .15, 0]; }),
  [1.05, .75, .3], [-1.05, .75, .3],
];

const SHAPES = {
  round: { sx: 1, sy: 1, n: 2 },
  egg: { sx: .9, sy: 1.08, n: 2, taper: .12 },
  obovoid: { sx: .9, sy: 1.08, n: 2, taper: -.14, faceY: -.05 },
  squircle: { sx: 1, sy: .92, n: 4 },
  bean: { sx: 1.18, sy: .84, n: 2.6 },
  tall: { sx: .84, sy: 1.12, n: 3.2 },
  gumdrop: { sx: 1, sy: .98, n: 2.6, taper: .22 },
  blob: { sx: 1, sy: .96, n: 2, wobble: .06 },
  cloud: { sx: 1.1, sy: .88, n: 2, bumps: .09, lobes: 7, fit: 1.12 },
  screen: { sx: 1.15, sy: .88, n: 6, fit: 1.08 },
  hexagon: { sx: .95, sy: .95, verts: regular(6, 1.08, 0, .22), bottom: .94, fit: 1.05 },
  pentagon: { sx: .92, sy: 1, verts: regular(5, 1.1, -Math.PI / 2, .28), bottom: .89, faceY: .04, fit: 1.05, shadow: .9 },
  pyramid: { sx: .8, sy: 1, verts: [[0, -1.12, .42], [1.18, .86, .3], [-1.18, .86, .3]], bottom: .86, faceY: .24, fit: 1.1, shadow: 1.25, glow: [-.18, -.35] },
  diamond: { sx: .78, sy: 1, verts: [[0, -1.15, .3], [1.04, 0, .3], [0, 1.15, .3], [-1.04, 0, .3]], bottom: 1.15, faceY: .04, fit: 1.12, shadow: .55, glow: [-.25, -.42] },
  shield: { sx: .95, sy: 1, verts: [[-1, -.85, .3], [1, -.85, .3], [1, .3, .4], [0, 1.12, .3], [-1, .3, .4]], bottom: 1.12, faceY: -.08, fit: 1.05, shadow: .6 },
  dome: { sx: 1, sy: .9, verts: domeVerts, bottom: .75, faceY: -.02, fit: 1.05, shadow: 1.05 },
};
export const HEADS = Object.fromEntries(Object.entries(SHAPES).map(([k, v]) => [k, { n: 2, taper: 0, ...v }]));

export const shapeLabel = k => HEADS[k].label || k[0].toUpperCase() + k.slice(1);

// A head instance carries its own phase so blobs don't all wobble in sync.
export const headFor = (key, phase) => ({ ...HEADS[key], phase });

// begin: false adds the outline to the current path (for compound clips) instead of starting a new one.
// H.points (a ring of [x, y] in head units) overrides the shape; morphs use it so every style can draw them.
export function headPath(ctx, cx, cy, R, H, now, begin = true) {
  if (H.points) {
    const p = H.points, n = p.length, mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    if (begin) ctx.beginPath();
    const m0 = mid(p[n - 1], p[0]);
    ctx.moveTo(cx + m0[0] * R, cy + m0[1] * R);
    for (let i = 0; i < n; i++) {
      const m1 = mid(p[i], p[(i + 1) % n]);
      ctx.quadraticCurveTo(cx + p[i][0] * R, cy + p[i][1] * R, cx + m1[0] * R, cy + m1[1] * R);
    }
    ctx.closePath();
    return;
  }
  if (H.verts) {
    const v = H.verts, n = v.length, P = i => v[(i + n) % n];
    const a = P(-1), b = P(0);
    if (begin) ctx.beginPath();
    ctx.moveTo(cx + (a[0] + b[0]) / 2 * R, cy + (a[1] + b[1]) / 2 * R);
    for (let i = 0; i < n; i++) {
      const p = P(i), q = P(i + 1);
      ctx.arcTo(cx + p[0] * R, cy + p[1] * R, cx + q[0] * R, cy + q[1] * R, p[2] * R);
    }
    ctx.closePath();
    return;
  }
  const N = H.bumps ? 140 : 72;
  if (begin) ctx.beginPath();
  for (let i = 0; i < N; i++) {
    const [x, y] = curvePoint(H, i / N * TAU, now);
    if (i) ctx.lineTo(cx + x * R, cy + y * R); else ctx.moveTo(cx + x * R, cy + y * R);
  }
  ctx.closePath();
}

// A point on a curved head's outline at angle th, in head units.
function curvePoint(H, th, now) {
  const e = 2 / H.n, c = Math.cos(th), s = Math.sin(th);
  let x = Math.sign(c) * Math.abs(c) ** e * H.sx, y = Math.sign(s) * Math.abs(s) ** e * H.sy;
  x *= 1 + H.taper * y;
  if (H.wobble) {
    const w = 1 + H.wobble * (Math.sin(3 * th + H.phase) * .7 + Math.sin(5 * th + H.phase * 2 + (reducedMotion ? 0 : now * .6)) * .3);
    x *= w; y *= w;
  }
  if (H.bumps) {
    const w = 1 + H.bumps * (Math.abs(Math.sin(H.lobes * th / 2)) - .5);
    x *= w; y *= w;
  }
  return [x, y];
}

// n points evenly spread around the outline, in head units, each with an outward normal [x, y, nx, ny].
// Polygon corners are left sharp here; it's close enough for decorating the edge (fur, chalk).
export function outlinePoints(H, n, now = 0) {
  let pts;
  if (H.points) {
    pts = Array.from({ length: n }, (_, k) => H.points[Math.floor(k * H.points.length / n)]);
  } else if (H.verts) {
    const v = H.verts, lens = v.map((p, i) => Math.hypot(v[(i + 1) % v.length][0] - p[0], v[(i + 1) % v.length][1] - p[1]));
    const total = lens.reduce((a, b) => a + b, 0);
    pts = Array.from({ length: n }, (_, k) => {
      let d = k / n * total, i = 0;
      while (d > lens[i]) d -= lens[i++];
      const p = v[i], q = v[(i + 1) % v.length], u = d / lens[i];
      return [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u];
    });
  } else {
    pts = Array.from({ length: n }, (_, k) => curvePoint(H, k / n * TAU, now));
  }
  return pts.map((p, i) => {
    const a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n];
    let nx = b[1] - a[1], ny = a[0] - b[0];
    const len = Math.hypot(nx, ny) || 1;
    nx /= len; ny /= len;
    if (nx * p[0] + ny * p[1] < 0) { nx = -nx; ny = -ny; }
    return [p[0], p[1], nx, ny];
  });
}

// Soft ellipse under the head; shrinks and fades as the head lifts.
export function drawShadow(ctx, base, { cx, groundY, R, head, lift, color }) {
  ctx.setTransform(base);
  ctx.globalAlpha = .08 * (1 - Math.min(.6, Math.max(0, lift * 3)));
  ctx.fillStyle = color;
  const footY = groundY + R * (head.bottom ?? head.sy * (1 + Math.abs(head.taper) * .3));
  const w = R * .8 * (head.shadow ?? head.sx * (1 + head.taper)) * (1 - Math.min(.5, Math.max(0, lift)) * .6);
  ctx.beginPath(); ctx.ellipse(cx, footY + R * .32, w, R * .1, 0, 0, TAU); ctx.fill();
  ctx.globalAlpha = 1;
}
