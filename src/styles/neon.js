import { headPath } from "../heads.js";
import { shapeSpace } from "./common.js";

// Neon tube colors from the buddy's hue; grays get cyan.
export function neonColors(color) {
  const h = color.s < 15 ? 190 : color.h;
  return { tube: `hsl(${h} 95% 62%)`, core: `hsl(${h} 100% 88%)`, body: `hsl(${h} 35% 11%)` };
}

// Dark head outlined by a glowing tube: a wide blurred stroke for the glow, then a thin bright core.
export function neon(ctx, m, o) {
  const { cx, cy, R, head, color, now, px } = o;
  const n = neonColors(color);
  ctx.setTransform(shapeSpace(m, o));
  headPath(ctx, cx, cy, R, head, now);
  ctx.fillStyle = n.body; ctx.fill();
  ctx.save();
  ctx.shadowColor = n.tube; ctx.shadowBlur = R * .3 * px;
  ctx.lineWidth = R * .05; ctx.lineJoin = "round"; ctx.strokeStyle = n.tube;
  ctx.stroke(); ctx.stroke();
  ctx.restore();
  ctx.lineWidth = R * .016; ctx.strokeStyle = n.core; ctx.stroke();
}
