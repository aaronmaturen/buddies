import { TAU, reducedMotion } from "../util.js";
import { headPath, outlinePoints } from "../heads.js";
import { mulberry32 } from "../random.js";
import { shapeSpace } from "./common.js";

const TUFTS = 150;

// Muppet plush: a soft body ringed with short fur tufts that sway, a darker under-layer of fur behind them,
// and a little fur texture across the face. Tuft lengths and angles are fixed per buddy so the fur doesn't
// shimmer, only sways.
export function fuzzy(ctx, m, o) {
  const { cx, cy, R, head, colors, now } = o;
  const shape = shapeSpace(m, o);
  const rand = mulberry32(Math.floor(head.phase * 1e6));
  const pts = outlinePoints(head, TUFTS, now);
  const tufts = pts.map(() => ({ len: .07 + rand() * .07, tilt: (rand() - .5) * .9, phase: rand() * TAU }));
  const sway = reducedMotion ? 0 : 1;

  ctx.setTransform(shape);
  ctx.lineCap = "round";
  for (const [layer, color, width, reach] of [[0, colors.shade, .05, 1.25], [1, colors.lit, .04, 1]]) {
    ctx.strokeStyle = color; ctx.lineWidth = R * width;
    ctx.beginPath();
    pts.forEach(([x, y, nx, ny], i) => {
      const t = tufts[i], a = t.tilt + sway * .25 * Math.sin(now * 2.6 + t.phase + i * .2);
      const dx = nx * Math.cos(a) - ny * Math.sin(a), dy = nx * Math.sin(a) + ny * Math.cos(a);
      const inset = layer ? .02 : .05, len = t.len * reach;
      ctx.moveTo(cx + R * (x - nx * inset), cy + R * (y - ny * inset));
      ctx.lineTo(cx + R * (x + dx * len), cy + R * (y + dy * len));
    });
    ctx.stroke();
    if (!layer) {
      headPath(ctx, cx, cy, R, head, now);
      ctx.fillStyle = colors.lit; ctx.fill();
    }
  }

  // Fur texture across the body, in fixed spots.
  ctx.save();
  headPath(ctx, cx, cy, R, head, now); ctx.clip();
  ctx.lineWidth = R * .018; ctx.strokeStyle = colors.shade; ctx.globalAlpha = .35;
  ctx.beginPath();
  for (let i = 0; i < 70; i++) {
    const x = (rand() * 2 - 1) * head.sx, y = (rand() * 2 - 1) * head.sy, a = rand() * TAU;
    ctx.moveTo(cx + R * x, cy + R * y); ctx.lineTo(cx + R * (x + Math.cos(a) * .05), cy + R * (y + Math.sin(a) * .05));
  }
  ctx.stroke();
  ctx.restore();
  ctx.globalAlpha = 1;
}
