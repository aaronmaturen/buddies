import { TAU } from "../util.js";
import { INK, headPath } from "../heads.js";
import { shapeSpace, litSpace } from "./common.js";

// Old comic print: flat color, the shadow printed as halftone dots that grow toward the shadow side, bold outline.
export function comic(ctx, m, o) {
  const { cx, cy, R, head, colors, now } = o;
  const shape = shapeSpace(m, o);
  ctx.setTransform(shape);
  headPath(ctx, cx, cy, R, head, now);
  ctx.fillStyle = colors.lit; ctx.fill();

  ctx.save();
  ctx.clip();
  ctx.setTransform(m); ctx.beginPath(); ctx.rect(cx - R * 3, cy - R * 3, R * 6, R * 6);
  ctx.setTransform(litSpace(m, o)); headPath(ctx, cx, cy, R, head, now, false);
  ctx.clip("evenodd");
  ctx.setTransform(m);
  ctx.fillStyle = colors.shade;
  const gap = R * .075;
  for (let y = -1.3; y <= 1.3; y += gap / R) {
    const row = Math.round(y * R / gap) % 2 ? gap / 2 : 0;
    for (let x = -1.3; x <= 1.3; x += gap / R) {
      // Bigger dots toward the lower right, where the shadow is deepest.
      const r = gap * (.22 + .18 * Math.min(1, Math.max(0, (x + y) * .5 + .4)));
      ctx.beginPath(); ctx.arc(cx + x * R + row, cy + y * R, r, 0, TAU); ctx.fill();
    }
  }
  ctx.restore();

  ctx.setTransform(shape);
  headPath(ctx, cx, cy, R, head, now);
  ctx.lineWidth = R * .045; ctx.lineJoin = "round"; ctx.strokeStyle = INK; ctx.stroke();
}
