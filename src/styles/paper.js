import { TAU, reducedMotion } from "../util.js";
import { headPath } from "../heads.js";
import { mulberry32 } from "../random.js";
import { shapeSpace, litSpace } from "./common.js";

const SNAP_FPS = 6;

// Paper cutout, stop-motion: the head is a piece of colored paper with a cast shadow and a lighter paper piece
// layered on top, and its tilt and position snap a few times a second like hand-animated frames.
export function paper(ctx, m, o) {
  const { cx, cy, R, head, colors, now } = o;
  const snap = mulberry32(Math.floor(reducedMotion ? 0 : now * SNAP_FPS) * 131 + Math.floor(head.phase * 1000));
  const j = s => (snap() * 2 - 1) * s;
  const shape = shapeSpace(m, o).translate(cx + j(R * .012), cy + j(R * .012)).rotate(j(2.2)).translate(-cx, -cy);

  ctx.setTransform(shape.translate(R * .05, R * .08));
  headPath(ctx, cx, cy, R, head, now);
  ctx.fillStyle = "rgba(20, 24, 40, .22)"; ctx.fill();

  ctx.setTransform(shape);
  headPath(ctx, cx, cy, R, head, now);
  ctx.fillStyle = colors.shade; ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.setTransform(litSpace(m, o).translate(cx, cy).rotate(j(2.2)).translate(-cx, -cy));
  headPath(ctx, cx, cy, R, head, now);
  ctx.fillStyle = colors.lit; ctx.fill();

  // Paper fibers in fixed spots.
  const fiber = mulberry32(Math.floor(head.phase * 1e6));
  ctx.setTransform(shape);
  for (let i = 0; i < 90; i++) {
    ctx.beginPath();
    ctx.arc(cx + R * (fiber() * 2.4 - 1.2), cy + R * (fiber() * 2.4 - 1.2), R * (.006 + fiber() * .01), 0, TAU);
    ctx.fillStyle = i % 3 ? "rgba(255, 255, 255, .3)" : "rgba(0, 0, 0, .07)"; ctx.fill();
  }
  ctx.restore();

  ctx.setTransform(shape);
  headPath(ctx, cx, cy, R, head, now);
  ctx.lineWidth = R * .022; ctx.lineJoin = "round"; ctx.strokeStyle = "rgba(255, 255, 255, .7)"; ctx.stroke();
}
