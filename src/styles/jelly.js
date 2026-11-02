import { TAU, reducedMotion } from "../util.js";
import { headPath } from "../heads.js";
import { shapeSpace } from "./common.js";

// See-through gummy: a gradient body you can half see through, a darker rim, a big shine, a few trapped
// bubbles, and a constant soft wobble.
export function jelly(ctx, m, o) {
  const { cx, cy, R, head, colors, now } = o;
  const w = reducedMotion ? 0 : .025 * Math.sin(now * 7 + head.phase * 3);
  const shape = shapeSpace(m, o).translate(cx, cy).scale(1 + w, 1 - w).translate(-cx, -cy);
  ctx.setTransform(shape);

  const g = ctx.createRadialGradient(cx - R * .3, cy - R * .35, R * .1, cx, cy, R * 1.25);
  g.addColorStop(0, colors.glow); g.addColorStop(.55, colors.lit); g.addColorStop(1, colors.shade);
  ctx.globalAlpha = .78;
  headPath(ctx, cx, cy, R, head, now);
  ctx.fillStyle = g; ctx.fill();
  ctx.globalAlpha = 1;
  ctx.lineWidth = R * .045; ctx.lineJoin = "round"; ctx.strokeStyle = colors.shade; ctx.stroke();

  ctx.fillStyle = "rgba(255, 255, 255, .45)";
  for (const [x, y, r] of [[.42, .38, .06], [.28, .55, .035], [-.35, .5, .045]]) {
    ctx.beginPath(); ctx.arc(cx + R * x * head.sx, cy + R * y * head.sy, R * r, 0, TAU); ctx.fill();
  }
  const [gx, gy] = head.glow || [-.4 * head.sx, -.48 * head.sy];
  ctx.beginPath(); ctx.ellipse(cx + R * gx, cy + R * gy, R * .26, R * .13, -.6, 0, TAU);
  ctx.fillStyle = "rgba(255, 255, 255, .75)"; ctx.fill();
  ctx.beginPath(); ctx.arc(cx + R * (gx + .3), cy + R * (gy - .05), R * .05, 0, TAU); ctx.fill();
}
