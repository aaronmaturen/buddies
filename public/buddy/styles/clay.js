import { headPath } from "../heads.js";
import { shapeSpace } from "./common.js";

// Claymation / soft 3D: smooth radial shading instead of bands, a soft blurry highlight, and a gentle
// darker rim. Matte and opaque, unlike jelly.
export function clay(ctx, m, o) {
  const { cx, cy, R, head, colors, now } = o;
  ctx.setTransform(shapeSpace(m, o));
  headPath(ctx, cx, cy, R, head, now);
  const body = ctx.createRadialGradient(cx - R * .35, cy - R * .4, R * .05, cx + R * .05, cy + R * .05, R * 1.2);
  body.addColorStop(0, colors.glow); body.addColorStop(.45, colors.lit); body.addColorStop(1, colors.shade);
  ctx.fillStyle = body; ctx.fill();

  ctx.save();
  ctx.clip();
  ctx.setTransform(m);
  const [gx, gy] = head.glow || [-.4 * head.sx, -.48 * head.sy];
  const shine = ctx.createRadialGradient(cx + R * gx, cy + R * gy, 0, cx + R * gx, cy + R * gy, R * .5);
  shine.addColorStop(0, "rgba(255, 255, 255, .55)"); shine.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = shine; ctx.fillRect(cx - R * 2, cy - R * 2, R * 4, R * 4);
  // Bounce light along the bottom edge keeps the underside from going muddy.
  const bounce = ctx.createRadialGradient(cx, cy + R * 1.25, R * .2, cx, cy + R * 1.25, R * .7);
  bounce.addColorStop(0, "rgba(255, 255, 255, .18)"); bounce.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = bounce; ctx.fillRect(cx - R * 2, cy - R * 2, R * 4, R * 4);
  ctx.restore();

  ctx.setTransform(shapeSpace(m, o));
  headPath(ctx, cx, cy, R, head, now);
  ctx.lineWidth = R * .02; ctx.strokeStyle = colors.shade; ctx.globalAlpha = .6; ctx.stroke();
  ctx.globalAlpha = 1;
}
