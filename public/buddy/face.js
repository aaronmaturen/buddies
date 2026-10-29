import { TAU, clamp } from "./util.js";
import { INK } from "./heads.js";

const WHITE = "#fbfbfd";
// The eye's top and bottom edges may close at most (1 - MIN_OPEN) of its height at the center.
const MIN_OPEN = .42;
const EYE_LINE = .03;

// Eye shapes as [width, height, corner roundness].
export const EYE_SHAPES = { round: [1, 1, .5], pill: [1.4, .72, .5], tall: [.74, 1.32, .5], soft: [1, .92, .26] };
export const EYE_LABELS = { round: "round", pill: "wide pill", tall: "tall oval", soft: "soft square" };

// Drawn in the eye's local frame (units of head radius), already placed on the head.
// The eye is one closed outline whose points are pushed around by the mood, so it always keeps its edge.
// Blinks squash the shape; only lid > 0 draws a real lid in the head's color.
// s: -1 left eye, 1 right. P: current mood values. open: 1 open, 0 shut. dy/dp: how far the gaze leads the head.
export function drawEye(ctx, { s, spec, P, open: openness, dy, dp, ink, lidFill }) {
  const k = P.eyeScale * (1 + P.eyeAsym * s), w = spec.eyeW * k;
  let tc = P.topCut + (s < 0 ? P.lidAsym : 0), bcut = P.botCut, bc = P.botCurve, tilt = P.tilt;
  const cover0 = Math.max(0, tc) + bcut + bc * .8;
  const f = Math.min(1, (1 - MIN_OPEN) / Math.max(1e-6, cover0));
  tc *= f; bcut *= f; bc *= f; tilt *= f;
  // Deformed eyes grow taller so arches and slants stay chunky instead of thin.
  const h = spec.eyeH * k * (1 + .5 * (Math.max(0, tc) + bcut + bc * .8));

  const xi = -s * w / 2, xo = s * w / 2;
  const yi = -h / 2 + h * clamp(tc + tilt * .3, 0, .9);
  const yo = -h / 2 + h * clamp(tc - tilt * .3, 0, .9);
  const slope = (yi - yo) / (xi - xo), top = x => yo + slope * (x - xo);
  const yb = h / 2 - h * bcut, arch = h * bc * .8;
  const bottom = x => yb - arch * (1 - (x / w) ** 2);

  const open = Math.max(.06, openness), pivot = h * .12;
  const squash = y => pivot + (y - pivot) * open;
  const n = 2 + (.5 - spec.corner) * 8, e = 2 / n, N = 64;
  const pts = [];
  for (let i = 0; i < N; i++) {
    const th = i / N * TAU, c = Math.cos(th), sn = Math.sin(th);
    const x = Math.sign(c) * Math.abs(c) ** e * w / 2;
    let y = Math.sign(sn) * Math.abs(sn) ** e * h / 2;
    y = Math.min(Math.max(y, top(x)), bottom(x));
    pts.push([x, squash(y)]);
  }
  const outline = () => {
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < N; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
  };

  outline(); ctx.fillStyle = WHITE; ctx.fill();
  ctx.save();
  outline(); ctx.clip();
  const pr = Math.min(w, spec.eyeH * k);
  const openCenter = squash((Math.max(-h / 2, top(0)) + bottom(0)) / 2);
  const px = clamp(dy * 1.1, -.45, .45) * w * .5;
  const py = openCenter + clamp(-dp * 1.1, -.4, .4) * h * .25 * open;
  ctx.beginPath(); ctx.arc(px, py, pr * .3 * P.pupil, 0, TAU); ctx.fillStyle = INK; ctx.fill();
  ctx.beginPath(); ctx.arc(px - pr * .1, py - pr * .11, pr * .08, 0, TAU); ctx.fillStyle = WHITE; ctx.fill();

  const L = P.lid;
  if (L > .01) {
    const lidY = x => squash(-h / 2 + h * L * .9 + h * .12 * L * (1 - (2 * x / w) ** 2));
    ctx.beginPath(); ctx.moveTo(-w, -h * 2); ctx.lineTo(-w, lidY(-w / 2));
    for (let i = 0; i <= 16; i++) { const x = -w / 2 + w * i / 16; ctx.lineTo(x, lidY(x)); }
    ctx.lineTo(w, lidY(w / 2)); ctx.lineTo(w, -h * 2); ctx.closePath();
    ctx.fillStyle = lidFill; ctx.fill();
    ctx.beginPath();
    for (let i = 0; i <= 16; i++) { const x = -w / 2 + w * i / 16; i ? ctx.lineTo(x, lidY(x)) : ctx.moveTo(x, lidY(x)); }
    ctx.lineWidth = EYE_LINE; ctx.lineCap = "round"; ctx.strokeStyle = ink; ctx.stroke();
  }
  ctx.restore();

  outline(); ctx.lineWidth = EYE_LINE; ctx.lineJoin = "round"; ctx.strokeStyle = ink; ctx.stroke();
}

export function drawBrow(ctx, { s, spec, P, ink }) {
  const t = P.browTilt, L = spec.browLen;
  const xi = -s * L / 2, xo = s * L / 2, yi = -t * .07, yo = t * .03;
  ctx.beginPath(); ctx.moveTo(xi, yi);
  ctx.quadraticCurveTo(0, (yi + yo) / 2 - P.browCurve * .05, xo, yo);
  ctx.lineWidth = spec.browThick; ctx.lineCap = "round"; ctx.strokeStyle = ink; ctx.stroke();
}

// Where the brow sits relative to its eye, in latitude.
export function browOffset(s, spec, P) {
  return -(spec.eyeH * P.eyeScale * .5 + spec.browGap) - P.browRaise
    - P.browAsym * (s > 0 ? 1 : -.4) + (P.topCut + P.lid) * .05;
}
