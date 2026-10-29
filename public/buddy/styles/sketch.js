import { headPath } from "../heads.js";
import { mulberry32 } from "../random.js";
import { shapeSpace, litSpace } from "./common.js";

export const PENCIL = "#2a2c35";
const BOIL_FPS = 8;

// Hand-drawn: color slightly off-register, pencil hatching in the shadow, and two wobbly outlines that
// redraw a few times a second ("boiling" lines).
export function sketch(ctx, m, o) {
  const { cx, cy, R, head, colors, now } = o;
  const shape = shapeSpace(m, o);
  const rand = mulberry32(Math.floor(now * BOIL_FPS) * 7919 + Math.floor(head.phase * 1000));
  const jitter = s => (rand() * 2 - 1) * s;

  ctx.setTransform(shape.translate(R * .03, R * .025));
  headPath(ctx, cx, cy, R, head, now);
  ctx.fillStyle = colors.lit; ctx.fill();

  // Hatch only where the head is in shadow: inside the head, outside the lit area.
  ctx.save();
  ctx.setTransform(shape); headPath(ctx, cx, cy, R, head, now); ctx.clip();
  ctx.setTransform(m); ctx.beginPath(); ctx.rect(cx - R * 3, cy - R * 3, R * 6, R * 6);
  ctx.setTransform(litSpace(m, o)); headPath(ctx, cx, cy, R, head, now, false);
  ctx.clip("evenodd");
  ctx.setTransform(shape);
  ctx.lineWidth = R * .014; ctx.lineCap = "round"; ctx.strokeStyle = "rgba(42, 44, 53, .45)";
  for (let x = -1.6; x < 1.6; x += .09) {
    ctx.beginPath();
    ctx.moveTo(cx + R * (x + jitter(.01)), cy + R * 1.3);
    ctx.lineTo(cx + R * (x + 1.1 + jitter(.01)), cy - R * 1.3);
    ctx.stroke();
  }
  ctx.restore();

  ctx.lineWidth = R * .022; ctx.lineJoin = "round"; ctx.strokeStyle = PENCIL;
  for (let i = 0; i < 2; i++) {
    ctx.globalAlpha = i ? .55 : .9;
    ctx.setTransform(shape.translate(cx + jitter(R * .018), cy + jitter(R * .018)).rotate(jitter(1.6)).scale(1 + jitter(.012)).translate(-cx, -cy));
    headPath(ctx, cx, cy, R, head, now);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
