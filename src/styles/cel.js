import { TAU } from "../util.js";
import { INK, headPath } from "../heads.js";
import { shapeSpace, litSpace } from "./common.js";

// Cel-shaded head: shade tone, a lit layer offset toward the light, a highlight, and an outline.
// Ghost is the same at low opacity without the outline.
export function cel(ctx, m, o, { alpha = 1, outline = true } = {}) {
  const { cx, cy, R, head, colors, now } = o;
  const shape = shapeSpace(m, o);
  ctx.globalAlpha = alpha;
  ctx.setTransform(shape);
  headPath(ctx, cx, cy, R, head, now);
  ctx.fillStyle = colors.shade; ctx.fill();
  ctx.save(); ctx.clip();
  ctx.setTransform(litSpace(m, o));
  headPath(ctx, cx, cy, R, head, now);
  ctx.fillStyle = colors.lit; ctx.fill();
  ctx.setTransform(m);
  const [gx, gy] = head.glow || [-.4 * head.sx, -.48 * head.sy];
  ctx.beginPath(); ctx.ellipse(cx + R * gx, cy + R * gy, R * .2, R * .1, -.6, 0, TAU);
  ctx.fillStyle = colors.glow; ctx.fill();
  ctx.restore();
  if (outline) {
    ctx.setTransform(shape);
    headPath(ctx, cx, cy, R, head, now);
    ctx.lineWidth = R * .035; ctx.lineJoin = "round"; ctx.strokeStyle = INK; ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

export const ghost = (ctx, m, o) => cel(ctx, m, o, { alpha: .2, outline: false });
