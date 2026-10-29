import { INK, headPath } from "../heads.js";
import { shapeSpace } from "./common.js";

export const PAPER = "#fdfcf8";

// Uncolored comic panel: paper-white fill, a bold ink outline, and a solid black shadow sliver.
// The paper rim sits outside the ink; drawn at R * .13 it shows R * .03 beyond the R * .065 outline.
export function inked(ctx, m, o) {
  const { cx, cy, R, head, now } = o;
  const shape = shapeSpace(m, o);
  ctx.setTransform(shape);
  headPath(ctx, cx, cy, R, head, now);
  // A paper rim outside the ink keeps the silhouette readable on dark backgrounds, where ink and page match.
  ctx.lineWidth = R * .13; ctx.lineJoin = "round"; ctx.strokeStyle = PAPER; ctx.stroke();
  ctx.fillStyle = PAPER; ctx.fill();

  // Shadow: inside the head, outside a copy nudged toward the light.
  ctx.save();
  ctx.clip();
  ctx.setTransform(m); ctx.beginPath(); ctx.rect(cx - R * 3, cy - R * 3, R * 6, R * 6);
  ctx.setTransform(m.translate(cx - R * .09, cy - R * .11).rotate(o.roll).translate(-cx, -cy));
  headPath(ctx, cx, cy, R, head, now, false);
  ctx.fillStyle = INK; ctx.fill("evenodd");
  ctx.restore();

  ctx.setTransform(shape);
  headPath(ctx, cx, cy, R, head, now);
  ctx.lineWidth = R * .065; ctx.lineJoin = "round"; ctx.strokeStyle = INK; ctx.stroke();
}
