import { reducedMotion } from "../util.js";
import { headPath } from "../heads.js";
import { mulberry32 } from "../random.js";
import { shapeSpace } from "./common.js";

export const HOLO = { line: "hsl(186 100% 66%)", core: "hsl(186 100% 90%)", fill: "rgba(10, 45, 60, .55)" };

// Projected hologram: see-through cyan with rolling scanlines, a glowing edge, an occasional flicker,
// and now and then a sideways glitch.
export function hologram(ctx, m, o) {
  const { cx, cy, R, head, now, px } = o;
  const tick = mulberry32(Math.floor(now * 12) + Math.floor(head.phase * 1000));
  const flicker = reducedMotion ? 1 : tick() < .06 ? .45 : .85 + .15 * Math.sin(now * 37);
  const cycle = now * 1.1 + head.phase;
  const glitch = !reducedMotion && cycle % 3 < .1 ? R * .07 * (tick() < .5 ? -1 : 1) : 0;
  const shape = shapeSpace(m, o).translate(glitch, 0);

  ctx.globalAlpha = flicker;
  ctx.setTransform(shape);
  headPath(ctx, cx, cy, R, head, now);
  const g = ctx.createLinearGradient(cx, cy - R, cx, cy + R);
  g.addColorStop(0, "rgba(120, 240, 255, .32)"); g.addColorStop(1, "rgba(120, 240, 255, .08)");
  ctx.fillStyle = g; ctx.fill();

  ctx.save();
  ctx.clip();
  ctx.setTransform(m.translate(glitch, 0));
  const gap = R * .05, roll = reducedMotion ? 0 : (now * R * .2) % gap;
  ctx.lineWidth = R * .012; ctx.strokeStyle = "rgba(160, 245, 255, .35)";
  ctx.beginPath();
  for (let y = cy - R * 1.3 + roll; y < cy + R * 1.3; y += gap) { ctx.moveTo(cx - R * 1.4, y); ctx.lineTo(cx + R * 1.4, y); }
  ctx.stroke();
  ctx.restore();

  ctx.setTransform(shape);
  headPath(ctx, cx, cy, R, head, now);
  ctx.save();
  ctx.shadowColor = HOLO.line; ctx.shadowBlur = R * .22 * px;
  ctx.lineWidth = R * .03; ctx.lineJoin = "round"; ctx.strokeStyle = HOLO.line; ctx.stroke();
  ctx.restore();
  ctx.lineWidth = R * .01; ctx.strokeStyle = HOLO.core; ctx.stroke();
  ctx.globalAlpha = 1;
}
