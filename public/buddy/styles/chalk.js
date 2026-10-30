import { headPath } from "../heads.js";
import { mulberry32 } from "../random.js";
import { shapeSpace } from "./common.js";

const BOIL_FPS = 10;
export const SLATE = "#26332f";

// Chalk in the buddy's hue, toned pastel the way colored chalk is; grays get plain white chalk.
export function chalkColor(color) {
  return color.s < 15 ? "hsl(60 20% 92%)" : `hsl(${color.h} 70% 82%)`;
}

// Chalk on slate: a dark slate head dusted with chalk grain, outlined by broken, doubled chalk strokes that
// redraw a few times a second.
export function chalk(ctx, m, o) {
  const { cx, cy, R, head, color, now } = o;
  const shape = shapeSpace(m, o);
  const tone = chalkColor(color);
  ctx.setTransform(shape);
  headPath(ctx, cx, cy, R, head, now);
  ctx.fillStyle = SLATE; ctx.fill();

  ctx.save();
  ctx.clip();
  const dust = mulberry32(Math.floor(head.phase * 1e6));
  ctx.fillStyle = tone;
  for (let i = 0; i < 260; i++) {
    ctx.globalAlpha = .05 + dust() * .12;
    ctx.fillRect(cx + R * (dust() * 2.4 - 1.2), cy + R * (dust() * 2.4 - 1.2), R * .012, R * .012);
  }
  const smudge = ctx.createRadialGradient(cx - R * .3, cy - R * .35, 0, cx - R * .3, cy - R * .35, R * .8);
  smudge.addColorStop(0, "rgba(255, 255, 255, .1)"); smudge.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.globalAlpha = 1; ctx.fillStyle = smudge; ctx.fillRect(cx - R * 2, cy - R * 2, R * 4, R * 4);
  ctx.restore();

  const boil = mulberry32(Math.floor(now * BOIL_FPS) * 7 + Math.floor(head.phase * 1000));
  const j = s => (boil() * 2 - 1) * s;
  ctx.lineWidth = R * .024; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = tone;
  for (let i = 0; i < 2; i++) {
    ctx.globalAlpha = i ? .45 : .8;
    ctx.setLineDash([R * (.12 + boil() * .1), R * (.015 + boil() * .03)]);
    ctx.lineDashOffset = j(R * .2);
    ctx.setTransform(shape.translate(cx + j(R * .012), cy + j(R * .012)).rotate(j(1.2)).translate(-cx, -cy));
    headPath(ctx, cx, cy, R, head, now);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
}
