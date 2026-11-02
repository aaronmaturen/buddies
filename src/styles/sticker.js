import { TAU } from "../util.js";
import { headPath } from "../heads.js";
import { shapeSpace } from "./common.js";

// Die-cut sticker: flat color, a thick white border and a soft drop shadow, no ink outline.
export function sticker(ctx, m, o) {
  const { cx, cy, R, head, colors, now, px } = o;
  ctx.setTransform(shapeSpace(m, o));
  ctx.save();
  ctx.shadowColor = "rgba(20, 24, 40, .22)"; ctx.shadowBlur = R * .12 * px; ctx.shadowOffsetY = R * .05 * px;
  headPath(ctx, cx, cy, R, head, now);
  ctx.lineWidth = R * .22; ctx.lineJoin = "round"; ctx.strokeStyle = "#ffffff"; ctx.stroke();
  ctx.fillStyle = "#ffffff"; ctx.fill();
  ctx.restore();
  headPath(ctx, cx, cy, R, head, now);
  ctx.fillStyle = colors.lit; ctx.fill();
  ctx.setTransform(m);
  const [gx, gy] = head.glow || [-.4 * head.sx, -.48 * head.sy];
  ctx.beginPath(); ctx.ellipse(cx + R * gx, cy + R * gy, R * .17, R * .08, -.6, 0, TAU);
  ctx.fillStyle = "rgba(255, 255, 255, .55)"; ctx.fill();
}
